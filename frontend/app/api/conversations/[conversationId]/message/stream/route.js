import {
  addAssistantMessage,
  addUserMessage,
  getConversation,
  updateConversationTitle,
} from '../../../../../../lib/storage.js';
import {
  calculateAggregateRankings,
  generateConversationTitle,
  stage1CollectResponses,
  stage2CollectRankings,
  stage3SynthesizeFinal,
} from '../../../../../../lib/council.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const { conversationId } = await params;
  const body = await request.json();
  const content = body?.content;

  if (!content) {
    return Response.json({ detail: 'Message content is required' }, { status: 400 });
  }

  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return Response.json({ detail: 'Conversation not found' }, { status: 404 });
  }

  const isFirstMessage = conversation.messages.length === 0;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (payload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        await addUserMessage(conversationId, content);

        let titlePromise = null;
        if (isFirstMessage) {
          titlePromise = generateConversationTitle(content);
        }

        sendEvent({ type: 'stage1_start' });
        const stage1Results = await stage1CollectResponses(content);
        sendEvent({ type: 'stage1_complete', data: stage1Results });

        sendEvent({ type: 'stage2_start' });
        const { stage2Results, labelToModel } = await stage2CollectRankings(
          content,
          stage1Results
        );
        const aggregateRankings = calculateAggregateRankings(
          stage2Results,
          labelToModel
        );
        sendEvent({
          type: 'stage2_complete',
          data: stage2Results,
          metadata: {
            label_to_model: labelToModel,
            aggregate_rankings: aggregateRankings,
          },
        });

        sendEvent({ type: 'stage3_start' });
        const stage3Result = await stage3SynthesizeFinal(
          content,
          stage1Results,
          stage2Results
        );
        sendEvent({ type: 'stage3_complete', data: stage3Result });

        if (titlePromise) {
          const title = await titlePromise;
          await updateConversationTitle(conversationId, title);
          sendEvent({ type: 'title_complete', data: { title } });
        }

        await addAssistantMessage(
          conversationId,
          stage1Results,
          stage2Results,
          stage3Result
        );

        sendEvent({ type: 'complete' });
      } catch (error) {
        sendEvent({
          type: 'error',
          message: error?.message || 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

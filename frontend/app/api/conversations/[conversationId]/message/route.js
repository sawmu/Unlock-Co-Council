import {
  addAssistantMessage,
  addUserMessage,
  getConversation,
  updateConversationTitle,
} from '../../../../../lib/storage.js';
import { generateConversationTitle, runFullCouncil } from '../../../../../lib/council.js';

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
  await addUserMessage(conversationId, content);

  if (isFirstMessage) {
    const title = await generateConversationTitle(content);
    await updateConversationTitle(conversationId, title);
  }

  const {
    stage1Results,
    stage2Results,
    stage3Result,
    metadata,
  } = await runFullCouncil(content);

  await addAssistantMessage(
    conversationId,
    stage1Results,
    stage2Results,
    stage3Result
  );

  return Response.json({
    stage1: stage1Results,
    stage2: stage2Results,
    stage3: stage3Result,
    metadata,
  });
}

import { getConversation } from '../../../../lib/storage.js';

export async function GET(request, { params }) {
  const { conversationId } = await params;
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return Response.json({ detail: 'Conversation not found' }, { status: 404 });
  }

  return Response.json(conversation);
}

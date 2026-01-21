import { randomUUID } from 'crypto';
import { createConversation, listConversations } from '../../../lib/storage.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const conversations = await listConversations();
  return Response.json(conversations);
}

export async function POST() {
  const conversationId = randomUUID();
  const conversation = await createConversation(conversationId);
  return Response.json(conversation);
}

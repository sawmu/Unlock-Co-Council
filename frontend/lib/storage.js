import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR } from './config.js';

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function getConversationPath(conversationId) {
  return path.join(DATA_DIR, `${conversationId}.json`);
}

export async function createConversation(conversationId) {
  await ensureDataDir();

  const conversation = {
    id: conversationId,
    created_at: new Date().toISOString(),
    title: 'New Conversation',
    messages: [],
  };

  const filePath = getConversationPath(conversationId);
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));

  return conversation;
}

export async function getConversation(conversationId) {
  const filePath = getConversationPath(conversationId);

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export async function saveConversation(conversation) {
  await ensureDataDir();
  const filePath = getConversationPath(conversation.id);
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));
}

export async function listConversations() {
  await ensureDataDir();
  const entries = await fs.readdir(DATA_DIR);
  const conversations = [];

  for (const filename of entries) {
    if (!filename.endsWith('.json')) continue;
    const filePath = path.join(DATA_DIR, filename);
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    conversations.push({
      id: data.id,
      created_at: data.created_at,
      title: data.title || 'New Conversation',
      message_count: Array.isArray(data.messages) ? data.messages.length : 0,
    });
  }

  conversations.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return conversations;
}

export async function addUserMessage(conversationId, content) {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  conversation.messages.push({
    role: 'user',
    content,
  });

  await saveConversation(conversation);
}

export async function addAssistantMessage(conversationId, stage1, stage2, stage3) {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  conversation.messages.push({
    role: 'assistant',
    stage1,
    stage2,
    stage3,
  });

  await saveConversation(conversation);
}

export async function updateConversationTitle(conversationId, title) {
  const conversation = await getConversation(conversationId);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  conversation.title = title;
  await saveConversation(conversation);
}

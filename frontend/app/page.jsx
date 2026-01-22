"use client";

import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import { api } from '../lib/api';

export default function HomePage() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastConversationKey = 'llm-council:last-conversation-id';

  const loadConversations = useCallback(async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  const loadConversation = useCallback(async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv ? { ...conv } : conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Restore last selected conversation or default to most recent.
  useEffect(() => {
    if (currentConversationId || conversations.length === 0) return;
    let nextId = null;
    try {
      const storedId = window.localStorage.getItem(lastConversationKey);
      if (storedId && conversations.some((conv) => conv.id === storedId)) {
        nextId = storedId;
      }
    } catch (error) {
      console.warn('Failed to read last conversation from storage:', error);
    }
    if (!nextId) {
      nextId = conversations[0].id;
    }
    setCurrentConversationId(nextId);
  }, [conversations, currentConversationId]);

  // Persist last selected conversation.
  useEffect(() => {
    if (!currentConversationId) return;
    try {
      window.localStorage.setItem(lastConversationKey, currentConversationId);
    } catch (error) {
      console.warn('Failed to save last conversation to storage:', error);
    }
  }, [currentConversationId]);

  // Load conversation details when selected
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId, loadConversation]);

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation();
      setConversations((prev) => [
        { id: newConv.id, created_at: newConv.created_at, message_count: 0 },
        ...prev,
      ]);
      setCurrentConversationId(newConv.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = async (id) => {
    const confirmed = window.confirm('Delete this conversation?');
    if (!confirmed) return;

    try {
      await api.deleteConversation(id);
      setConversations((prev) => {
        const next = prev.filter((conv) => conv.id !== id);
        if (currentConversationId === id) {
          const nextId = next[0]?.id ?? null;
          setCurrentConversationId(nextId);
          setCurrentConversation(null);
          try {
            window.localStorage.removeItem(lastConversationKey);
          } catch (error) {
            console.warn('Failed to clear last conversation from storage:', error);
          }
        }
        return next;
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSendMessage = async (content) => {
    if (!currentConversationId) return;

    setIsLoading(true);
    try {
      // Optimistically add user message to UI
      const userMessage = { role: 'user', content };
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Create a partial assistant message that will be updated progressively
      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: {
          stage1: false,
          stage2: false,
          stage3: false,
        },
      };

      // Add the partial assistant message
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      // Send message with streaming
      const updateLastMessage = (updater) => {
        setCurrentConversation((prev) => {
          if (!prev || prev.messages.length === 0) return prev;
          const lastIndex = prev.messages.length - 1;
          const messages = prev.messages.map((msg, index) =>
            index === lastIndex ? updater(msg) : msg
          );
          return { ...prev, messages };
        });
      };

      await api.sendMessageStream(currentConversationId, content, (eventType, event) => {
        switch (eventType) {
          case 'stage1_start':
            updateLastMessage((msg) => ({
              ...msg,
              loading: { ...msg.loading, stage1: true },
            }));
            break;

          case 'stage1_complete':
            updateLastMessage((msg) => ({
              ...msg,
              stage1: event.data,
              loading: { ...msg.loading, stage1: false },
            }));
            break;

          case 'stage2_start':
            updateLastMessage((msg) => ({
              ...msg,
              loading: { ...msg.loading, stage2: true },
            }));
            break;

          case 'stage2_complete':
            updateLastMessage((msg) => ({
              ...msg,
              stage2: event.data,
              metadata: event.metadata,
              loading: { ...msg.loading, stage2: false },
            }));
            break;

          case 'stage3_start':
            updateLastMessage((msg) => ({
              ...msg,
              loading: { ...msg.loading, stage3: true },
            }));
            break;

          case 'stage3_complete':
            updateLastMessage((msg) => ({
              ...msg,
              stage3: event.data,
              loading: { ...msg.loading, stage3: false },
            }));
            break;

          case 'title_complete':
            // Reload conversations to get updated title
            loadConversations();
            break;

          case 'complete':
            // Stream complete, reload conversations list
            loadConversations();
            setIsLoading(false);
            break;

          case 'error':
            console.error('Stream error:', event.message);
            setIsLoading(false);
            break;

          default:
            console.log('Unknown event type:', eventType);
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic messages on error
      setCurrentConversation((prev) => ({
        ...prev,
        messages: prev.messages.slice(0, -2),
      }));
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <div className="main-panel">
        <ChatInterface
          conversation={currentConversation}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

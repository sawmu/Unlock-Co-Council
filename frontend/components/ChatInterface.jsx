import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import styles from './ChatInterface.module.css';

export default function ChatInterface({
  conversation,
  onSendMessage,
  isLoading,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const conversationTitle = conversation?.title || 'New Conversation';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.chatInterface}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderTitle}>Unlock &amp; Co Council</div>
        <div className={styles.chatHeaderSubtitle}>{conversationTitle}</div>
      </div>

      <div className={styles.messagesContainer}>
        {!conversation ? (
          <div className={styles.emptyState}>
            <h2>Welcome to Unlock &amp; Co Council</h2>
            <p>Create a new conversation to get started.</p>
          </div>
        ) : conversation.messages.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Start a conversation</h2>
            <p>Ask a question to consult the Unlock &amp; Co Council.</p>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className={styles.messageGroup}>
              {msg.role === 'user' ? (
                <div className={styles.userMessage}>
                  <div className={styles.messageLabel}>You</div>
                  <div className={styles.messageContent}>
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.assistantMessage}>
                  <div className={styles.messageLabel}>Unlock &amp; Co Council</div>

                  {/* Stage 1 */}
                  {msg.loading?.stage1 && (
                    <div className={styles.stageLoading}>
                      <div className={styles.spinner}></div>
                      <span>Running Stage 1: Collecting individual responses...</span>
                    </div>
                  )}
                  {msg.stage1 && <Stage1 responses={msg.stage1} />}

                  {/* Stage 2 */}
                  {msg.loading?.stage2 && (
                    <div className={styles.stageLoading}>
                      <div className={styles.spinner}></div>
                      <span>Running Stage 2: Peer rankings...</span>
                    </div>
                  )}
                  {msg.stage2 && (
                    <Stage2
                      rankings={msg.stage2}
                      labelToModel={msg.metadata?.label_to_model}
                      aggregateRankings={msg.metadata?.aggregate_rankings}
                    />
                  )}

                  {/* Stage 3 */}
                  {msg.loading?.stage3 && (
                    <div className={styles.stageLoading}>
                      <div className={styles.spinner}></div>
                      <span>Running Stage 3: Final synthesis...</span>
                    </div>
                  )}
                  {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.spinner}></div>
            <span>Consulting the council...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <div className={styles.inputShell}>
          <textarea
            className={styles.messageInput}
            placeholder={
              conversation
                ? 'Ask your question... (Shift+Enter for new line, Enter to send)'
                : 'Create a new conversation to begin.'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !conversation}
            rows={2}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!input.trim() || isLoading || !conversation}
          >
            Send
          </button>
        </div>
        <div className={styles.inputHint}>Shift+Enter for a new line.</div>
      </form>
    </div>
  );
}

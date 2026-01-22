import { useState } from 'react';
import styles from './Sidebar.module.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNewConversation = () => {
    onNewConversation();
    setIsMenuOpen(false);
  };

  const handleSelectConversation = (id) => {
    onSelectConversation(id);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className={styles.mobileBar}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          ☰
        </button>
        <div className={styles.mobileTitle}>Unlock &amp; Co Council</div>
        <div className={styles.mobileSpacer} aria-hidden="true" />
      </div>

      <div
        className={`${styles.backdrop} ${
          isMenuOpen ? styles.backdropVisible : ''
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <div
        id="mobile-menu"
        className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <h1>Unlock &amp; Co Council</h1>
          <button
            className={styles.newConversationBtn}
            onClick={handleNewConversation}
          >
            + New Conversation
          </button>
        </div>

        <div className={styles.conversationList}>
          {conversations.length === 0 ? (
            <div className={styles.noConversations}>No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`${styles.conversationItem} ${
                  conv.id === currentConversationId ? styles.active : ''
                }`}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <div className={styles.conversationTitle}>
                  {conv.title || 'New Conversation'}
                </div>
                <div className={styles.conversationMeta}>
                  {conv.message_count} messages
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

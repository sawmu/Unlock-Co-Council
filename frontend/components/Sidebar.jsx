import { useState } from 'react';
import styles from './Sidebar.module.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
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

  const handleDeleteConversation = (event, id) => {
    event.stopPropagation();
    onDeleteConversation(id);
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
        <div className={styles.mobileTitle}>Unlock &amp; Co</div>
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
          <h1 className={styles.sidebarTitle}>
            <span className={styles.titleIcon} aria-hidden="true" />
            <span className={styles.titleText}>Unlock &amp; Co</span>
          </h1>
          <button
            className={styles.newConversationBtn}
            onClick={handleNewConversation}
          >
            New Conversation
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
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationTitle}>
                    {conv.title || 'New Conversation'}
                  </div>
                  <div className={styles.conversationMeta}>
                    <span className={styles.messageIcon} aria-hidden="true" />
                    {conv.message_count}
                  </div>
                </div>
                <button
                  className={styles.deleteButton}
                  type="button"
                  aria-label="Delete conversation"
                  onClick={(event) => handleDeleteConversation(event, conv.id)}
                >
                  <span className={styles.deleteIcon} aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

import styles from './Sidebar.module.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h1>Unlock &amp; Co Council</h1>
        <button className={styles.newConversationBtn} onClick={onNewConversation}>
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
              onClick={() => onSelectConversation(conv.id)}
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
  );
}

import ReactMarkdown from 'react-markdown';
import styles from './Stage3.module.css';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  return (
    <div className={`${styles.stage} ${styles.stage3}`}>
      <h3 className={styles.stageTitle}>Stage 3: Final Council Answer</h3>
      <div className={styles.finalResponse}>
        <div className={styles.chairmanLabel}>
          Chairman: {finalResponse.model.split('/')[1] || finalResponse.model}
        </div>
        <div className={`${styles.finalText} markdown-content`}>
          <ReactMarkdown>{finalResponse.response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

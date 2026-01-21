import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './Stage1.module.css';

export default function Stage1({ responses }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className={styles.stage}>
      <h3 className={styles.stageTitle}>Stage 1: Individual Responses</h3>

      <div className={styles.tabs}>
        {responses.map((resp, index) => (
          <button
            key={index}
            className={`${styles.tab} ${
              activeTab === index ? styles.active : ''
            }`}
            onClick={() => setActiveTab(index)}
          >
            {resp.model.split('/')[1] || resp.model}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        <div className={styles.modelName}>{responses[activeTab].model}</div>
        <div className={`${styles.responseText} markdown-content`}>
          <ReactMarkdown>{responses[activeTab].response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './Stage2.module.css';

function deAnonymizeText(text, labelToModel) {
  if (!labelToModel) return text;

  let result = text;
  // Replace each "Response X" with the actual model name
  Object.entries(labelToModel).forEach(([label, model]) => {
    const modelShortName = model.split('/')[1] || model;
    result = result.replace(new RegExp(label, 'g'), `**${modelShortName}**`);
  });
  return result;
}

export default function Stage2({ rankings, labelToModel, aggregateRankings }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.stage} ${styles.stage2}`}>
      <h3 className={styles.stageTitle}>Stage 2: Peer Rankings</h3>

      <h4>Raw Evaluations</h4>
      <p className={styles.stageDescription}>
        Each model evaluated all responses (anonymized as Response A, B, C, etc.) and provided rankings.
        Below, model names are shown in <strong>bold</strong> for readability, but the original evaluation used anonymous labels.
      </p>

      <div className={styles.tabs}>
        {rankings.map((rank, index) => (
          <button
            key={index}
            className={`${styles.tab} ${activeTab === index ? styles.active : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {rank.model.split('/')[1] || rank.model}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        <div className={styles.rankingModel}>
          {rankings[activeTab].model}
        </div>
        <div className={`${styles.rankingContent} markdown-content`}>
          <ReactMarkdown>
            {deAnonymizeText(rankings[activeTab].ranking, labelToModel)}
          </ReactMarkdown>
        </div>

        {rankings[activeTab].parsed_ranking &&
         rankings[activeTab].parsed_ranking.length > 0 && (
          <div className={styles.parsedRanking}>
            <strong>Extracted Ranking:</strong>
            <ol>
              {rankings[activeTab].parsed_ranking.map((label, i) => (
                <li key={i}>
                  {labelToModel && labelToModel[label]
                    ? labelToModel[label].split('/')[1] || labelToModel[label]
                    : label}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {aggregateRankings && aggregateRankings.length > 0 && (
        <div className={styles.aggregateRankings}>
          <h4>Aggregate Rankings (Street Cred)</h4>
          <p className={styles.stageDescription}>
            Combined results across all peer evaluations (lower score is better):
          </p>
          <div className={styles.aggregateList}>
            {aggregateRankings.map((agg, index) => (
              <div key={index} className={styles.aggregateItem}>
                <span className={styles.rankPosition}>#{index + 1}</span>
                <span className={styles.rankModel}>
                  {agg.model.split('/')[1] || agg.model}
                </span>
                <span className={styles.rankScore}>
                  Avg: {agg.average_rank.toFixed(2)}
                </span>
                <span className={styles.rankCount}>
                  ({agg.rankings_count} votes)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

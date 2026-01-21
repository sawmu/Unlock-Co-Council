import { COUNCIL_MODELS, CHAIRMAN_MODEL } from './config.js';
import { queryModel, queryModelsParallel } from './openrouter.js';

export async function stage1CollectResponses(userQuery) {
  const messages = [{ role: 'user', content: userQuery }];
  const responses = await queryModelsParallel(COUNCIL_MODELS, messages);

  return Object.entries(responses)
    .filter(([, response]) => response)
    .map(([model, response]) => ({
      model,
      response: response.content || '',
    }));
}

export async function stage2CollectRankings(userQuery, stage1Results) {
  const labels = stage1Results.map((_, index) =>
    String.fromCharCode(65 + index)
  );

  const labelToModel = Object.fromEntries(
    labels.map((label, index) => [
      `Response ${label}`,
      stage1Results[index].model,
    ])
  );

  const responsesText = labels
    .map((label, index) => `Response ${label}:\n${stage1Results[index].response}`)
    .join('\n\n');

  const rankingPrompt = `You are evaluating different responses to the following question:

Question: ${userQuery}

Here are the responses from different models (anonymized):

${responsesText}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any other text or explanations in the ranking section

Example of the correct format for your ENTIRE response:

Response A provides good detail on X but misses Y...
Response B is accurate but lacks depth on Z...
Response C offers the most comprehensive answer...

FINAL RANKING:
1. Response C
2. Response A
3. Response B

Now provide your evaluation and ranking:`;

  const messages = [{ role: 'user', content: rankingPrompt }];
  const responses = await queryModelsParallel(COUNCIL_MODELS, messages);

  const stage2Results = Object.entries(responses)
    .filter(([, response]) => response)
    .map(([model, response]) => {
      const fullText = response.content || '';
      return {
        model,
        ranking: fullText,
        parsed_ranking: parseRankingFromText(fullText),
      };
    });

  return { stage2Results, labelToModel };
}

export async function stage3SynthesizeFinal(userQuery, stage1Results, stage2Results) {
  const stage1Text = stage1Results
    .map((result) => `Model: ${result.model}\nResponse: ${result.response}`)
    .join('\n\n');

  const stage2Text = stage2Results
    .map((result) => `Model: ${result.model}\nRanking: ${result.ranking}`)
    .join('\n\n');

  const chairmanPrompt = `You are the Chairman of an LLM Council. Multiple AI models have provided responses to a user's question, and then ranked each other's responses.

Original Question: ${userQuery}

STAGE 1 - Individual Responses:
${stage1Text}

STAGE 2 - Peer Rankings:
${stage2Text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, accurate answer to the user's original question. Consider:
- The individual responses and their insights
- The peer rankings and what they reveal about response quality
- Any patterns of agreement or disagreement

Provide a clear, well-reasoned final answer that represents the council's collective wisdom:`;

  const messages = [{ role: 'user', content: chairmanPrompt }];
  const response = await queryModel(CHAIRMAN_MODEL, messages);

  if (!response) {
    return {
      model: CHAIRMAN_MODEL,
      response: 'Error: Unable to generate final synthesis.',
    };
  }

  return {
    model: CHAIRMAN_MODEL,
    response: response.content || '',
  };
}

export function parseRankingFromText(rankingText) {
  if (rankingText.includes('FINAL RANKING:')) {
    const parts = rankingText.split('FINAL RANKING:');
    if (parts.length >= 2) {
      const rankingSection = parts[1];
      const numberedMatches = rankingSection.match(/\d+\.\s*Response [A-Z]/g);
      if (numberedMatches) {
        return numberedMatches.map((match) => {
          const labelMatch = match.match(/Response [A-Z]/);
          return labelMatch ? labelMatch[0] : match;
        });
      }

      const matches = rankingSection.match(/Response [A-Z]/g);
      return matches || [];
    }
  }

  const matches = rankingText.match(/Response [A-Z]/g);
  return matches || [];
}

export function calculateAggregateRankings(stage2Results, labelToModel) {
  const modelPositions = new Map();

  for (const ranking of stage2Results) {
    const parsedRanking = parseRankingFromText(ranking.ranking || '');

    parsedRanking.forEach((label, index) => {
      if (!labelToModel[label]) return;
      const modelName = labelToModel[label];
      if (!modelPositions.has(modelName)) {
        modelPositions.set(modelName, []);
      }
      modelPositions.get(modelName).push(index + 1);
    });
  }

  const aggregate = [];
  for (const [model, positions] of modelPositions.entries()) {
    if (positions.length === 0) continue;
    const avgRank = positions.reduce((sum, value) => sum + value, 0) / positions.length;
    aggregate.push({
      model,
      average_rank: Math.round(avgRank * 100) / 100,
      rankings_count: positions.length,
    });
  }

  aggregate.sort((a, b) => a.average_rank - b.average_rank);
  return aggregate;
}

export async function generateConversationTitle(userQuery) {
  const titlePrompt = `Generate a very short title (3-5 words maximum) that summarizes the following question.
The title should be concise and descriptive. Do not use quotes or punctuation in the title.

Question: ${userQuery}

Title:`;

  const messages = [{ role: 'user', content: titlePrompt }];
  const response = await queryModel('google/gemini-2.5-flash', messages, 30000);

  if (!response) {
    return 'New Conversation';
  }

  let title = (response.content || 'New Conversation').trim();
  title = title.replace(/^["']+|["']+$/g, '');

  if (title.length > 50) {
    title = `${title.slice(0, 47)}...`;
  }

  return title;
}

export async function runFullCouncil(userQuery) {
  const stage1Results = await stage1CollectResponses(userQuery);

  if (!stage1Results.length) {
    return {
      stage1Results: [],
      stage2Results: [],
      stage3Result: {
        model: 'error',
        response: 'All models failed to respond. Please try again.',
      },
      metadata: {},
    };
  }

  const { stage2Results, labelToModel } = await stage2CollectRankings(
    userQuery,
    stage1Results
  );
  const aggregateRankings = calculateAggregateRankings(stage2Results, labelToModel);
  const stage3Result = await stage3SynthesizeFinal(
    userQuery,
    stage1Results,
    stage2Results
  );

  return {
    stage1Results,
    stage2Results,
    stage3Result,
    metadata: {
      label_to_model: labelToModel,
      aggregate_rankings: aggregateRankings,
    },
  };
}

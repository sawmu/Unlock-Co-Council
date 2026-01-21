import { OPENROUTER_API_KEY, OPENROUTER_API_URL } from './config.js';

export async function queryModel(model, messages, timeoutMs = 120000) {
  if (!OPENROUTER_API_KEY) {
    console.error('Missing OPENROUTER_API_KEY');
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${text}`);
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message || {};

    return {
      content: message.content ?? '',
      reasoning_details: message.reasoning_details,
    };
  } catch (error) {
    console.error(`Error querying model ${model}:`, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function queryModelsParallel(models, messages) {
  const tasks = models.map((model) => queryModel(model, messages));
  const responses = await Promise.all(tasks);
  return Object.fromEntries(models.map((model, idx) => [model, responses[idx]]));
}

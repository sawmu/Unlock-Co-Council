import path from 'path';

const DEFAULT_COUNCIL_MODELS = [
  'openai/gpt-5.1',
  'google/gemini-3-pro-preview',
  'anthropic/claude-sonnet-4.5',
  'x-ai/grok-4',
];

const parseModels = () => {
  const raw = process.env.COUNCIL_MODELS;
  if (!raw) return DEFAULT_COUNCIL_MODELS;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (_error) {
    const csv = raw.split(',').map((item) => item.trim()).filter(Boolean);
    if (csv.length > 0) return csv;
  }

  return DEFAULT_COUNCIL_MODELS;
};

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
export const OPENROUTER_API_URL =
  process.env.OPENROUTER_API_URL ||
  'https://openrouter.ai/api/v1/chat/completions';
export const COUNCIL_MODELS = parseModels();
export const CHAIRMAN_MODEL =
  process.env.CHAIRMAN_MODEL || 'google/gemini-3-pro-preview';
export const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(process.cwd(), '..', 'data', 'conversations');

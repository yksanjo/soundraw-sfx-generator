import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { SFX_MOODS, SFX_GENRES } from '../types/index.js';
import type { DeepSeekSfxParams } from '../types/index.js';

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required');
    }
    client = new OpenAI({
      apiKey,
      baseURL: DEEPSEEK_BASE_URL,
    });
  }
  return client;
}

const SFX_ANALYSIS_SYSTEM_PROMPT = `You are a game sound effects specialist. Your job is to translate SFX descriptions into Soundraw API parameters.

Available Soundraw parameters:

MOODS (pick 1-2):
${SFX_MOODS.join(', ')}

GENRES (pick 1-2):
${SFX_GENRES.join(', ')}

THEMES (pick 1):
- Gaming
- Cinematic
- Nature
- Technology
- Sports & Action

TEMPO: low (<100 bpm), normal (100-125 bpm), high (>125 bpm)

ENERGY_PROFILE: building, steady, climax, ambient, muted

For SFX, use shorter, more focused parameters. Output ONLY valid JSON:
{
  "moods": ["mood1"],
  "genres": ["genre1"],
  "themes": ["theme1"],
  "tempo": "low" | "normal" | "high",
  "energy_profile": "building" | "steady" | "climax" | "ambient" | "muted",
  "reasoning": "Brief explanation"
}

SFX mapping guidelines:
- Combat (sword, punch, magic): Epic, Dark moods + Orchestra, Electronica + high tempo + climax
- UI (click, hover, success): Happy, Epic moods + Electronica + normal/high tempo + steady
- Nature (wind, rain, birds): Peaceful moods + Ambient + low tempo + ambient
- Mechanical (engine, gears, clicks): Tense, Dark moods + Electronica + normal tempo + steady
- Magical (sparkle, whoosh, blast): Epic, Happy moods + Orchestra, Electronica + high tempo + climax
- Footsteps (grass, stone, wood): Neutral + Ambient + low tempo + steady
- Impacts (crash, bang, explosion): Dark, Epic moods + Orchestra, Rock + high tempo + climax
- Vehicles (engine, horn, brake): Tense moods + Electronica + high tempo + steady
- Weather (rain, thunder, wind): Dark, Peaceful moods + Ambient + low tempo + ambient`;

export async function analyzeSfxDescription(
  description: string,
  category?: string,
  intensity?: string
): Promise<DeepSeekSfxParams> {
  logger.info('Analyzing SFX description', { description, category, intensity });

  const userPrompt = `Generate Soundraw parameters for this sound effect:

Description: ${description}
${category ? `Category: ${category}` : ''}
${intensity ? `Intensity: ${intensity}` : ''}

Output only valid JSON, no markdown.`;

  const client = getClient();

  const response = await client.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: SFX_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 400,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from DeepSeek');
  }

  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }

  try {
    const params = JSON.parse(jsonStr) as DeepSeekSfxParams;

    // Validate moods are from allowed list
    params.moods = params.moods.filter(m =>
      SFX_MOODS.includes(m as typeof SFX_MOODS[number])
    );
    params.genres = params.genres.filter(g =>
      SFX_GENRES.includes(g as typeof SFX_GENRES[number])
    );

    // Ensure at least one of each if filtering removed all
    if (params.moods.length === 0) params.moods = ['Epic'];
    if (params.genres.length === 0) params.genres = ['Electronica'];
    if (params.themes.length === 0) params.themes = ['Gaming'];

    logger.info('SFX analysis complete', { moods: params.moods, tempo: params.tempo });
    return params;
  } catch (error) {
    logger.error('Failed to parse DeepSeek response', { content, error });
    throw new Error(`Failed to parse SFX parameters: ${content}`);
  }
}

import { analyzeSfxDescription } from '../services/deepseek.js';
import { composeSfx, extractSfxResult } from '../services/soundraw.js';
import { getSfxIntegrationCode } from '../prompts/integration.js';
import type { GenerateSfxInput, SfxResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function generateSfx(input: GenerateSfxInput): Promise<SfxResult> {
  logger.info('Generating SFX', { description: input.description, category: input.category });

  // Step 1: Analyze description with DeepSeek
  const sfxParams = await analyzeSfxDescription(
    input.description,
    input.category,
    input.intensity
  );

  // Step 2: Generate SFX with Soundraw
  const duration = input.duration_seconds || 5;
  const { result, format } = await composeSfx({
    moods: sfxParams.moods,
    genres: sfxParams.genres,
    themes: sfxParams.themes,
    length: duration,
    energy: sfxParams.energy_profile,
    tempo: sfxParams.tempo,
    file_format: input.file_format ? [input.file_format] : undefined,
  });

  // Step 3: Extract result
  const extracted = extractSfxResult(result, format);

  // Step 4: Generate integration code if engine specified
  const sfxName = input.description.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
  const integrationCode = getSfxIntegrationCode(
    input.engine,
    extracted.audio_url,
    sfxName
  );

  return {
    share_link: extracted.share_link,
    audio_url: extracted.audio_url,
    request_id: extracted.request_id,
    duration_seconds: extracted.duration_seconds,
    bpm: extracted.bpm,
    file_format: format,
    integration_code: integrationCode,
    deepseek_reasoning: sfxParams.reasoning,
    soundraw_params: {
      moods: sfxParams.moods,
      genres: sfxParams.genres,
      themes: sfxParams.themes,
      tempo: sfxParams.tempo,
      energy_profile: sfxParams.energy_profile,
    },
  };
}

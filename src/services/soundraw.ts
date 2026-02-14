import { logger } from '../utils/logger.js';
import type { DeepSeekSfxParams } from '../types/index.js';

const SOUNDRAW_API_BASE_URL = 'https://soundraw.io/api/v3';
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 75; // Max 2.5 minutes for shorter SFX

function getApiKey(): string {
  const apiKey = process.env.SOUNDRAW_API_KEY;
  if (!apiKey) {
    throw new Error('SOUNDRAW_API_KEY environment variable is required');
  }
  return apiKey;
}

function getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface SoundrawComposeResponse {
  request_id: string;
}

interface SoundrawResultResponse {
  request_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  result?: {
    share_link: string;
    m4a_url: string;
    mp3_url: string;
    wav_url: string;
    length: number;
    bpm: string;
    timestamps: Array<{ start: number; end: number; energy: string }>;
  };
}

async function pollForResult(requestId: string): Promise<SoundrawResultResponse> {
  logger.info('Polling for SFX result', { requestId });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(`${SOUNDRAW_API_BASE_URL}/results/${requestId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Soundraw results API error', { status: response.status, error: errorText });
      throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as SoundrawResultResponse;
    
    if (result.status === 'done' && result.result) {
      logger.info('SFX generation complete', { requestId });
      return result;
    }

    if (result.status === 'failed') {
      logger.error('SFX generation failed', { requestId });
      throw new Error(`Soundraw generation failed for request: ${requestId}`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timeout waiting for Soundraw result: ${requestId}`);
}

function getAudioUrl(result: SoundrawResultResponse['result'], format: string): string {
  if (!result) throw new Error('No result available');

  switch (format) {
    case 'wav': return result.wav_url || '';
    case 'mp3': return result.mp3_url || '';
    case 'm4a':
    default: return result.m4a_url || result.mp3_url || result.wav_url || '';
  }
}

export interface ComposeParams {
  moods: string[];
  genres: string[];
  themes: string[];
  length: number;
  energy?: string;
  tempo?: string;
  file_format?: string[];
}

export async function composeSfx(params: ComposeParams): Promise<{
  result: SoundrawResultResponse;
  format: string;
}> {
  logger.info('Composing SFX via Soundraw', { 
    length: params.length, 
    moods: params.moods,
    genres: params.genres 
  });

  const requestBody = {
    moods: params.moods,
    genres: params.genres,
    themes: params.themes,
    length: params.length,
    energy: params.energy || 'steady',
    tempo: params.tempo || 'normal',
    file_format: params.file_format || ['m4a'],
  };

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/musics/compose`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Soundraw compose API error', { status: response.status, error: errorText });
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  const { request_id } = await response.json() as SoundrawComposeResponse;
  logger.info('SFX compose request submitted', { request_id });

  const result = await pollForResult(request_id);
  const format = params.file_format?.[0] || 'm4a';

  return { result, format };
}

export async function createSfxVariation(
  shareLink: string,
  variationType: string,
  length?: number
): Promise<{ result: SoundrawResultResponse; format: string }> {
  logger.info('Creating SFX variation via Soundraw', { shareLink, variationType });

  const requestBody: Record<string, unknown> = {
    share_link: shareLink,
    variation_type: variationType,
  };
  
  if (length) {
    requestBody.length = length;
  }

  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/musics/similar`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  const { request_id } = await response.json() as SoundrawComposeResponse;
  const result = await pollForResult(request_id);

  return { result, format: 'm4a' };
}

export function extractSfxResult(
  soundrawResult: SoundrawResultResponse,
  format: string
): {
  share_link: string;
  audio_url: string;
  request_id: string;
  duration_seconds: number;
  bpm: number;
  timestamps: Array<{ start: number; end: number; energy: string }>;
} {
  if (!soundrawResult.result) {
    throw new Error('No result in Soundraw response');
  }

  const { result } = soundrawResult;

  return {
    share_link: result.share_link,
    audio_url: getAudioUrl(result, format),
    request_id: soundrawResult.request_id,
    duration_seconds: result.length,
    bpm: parseInt(result.bpm, 10),
    timestamps: result.timestamps,
  };
}

export async function getAccountUsage(): Promise<{ message: string }> {
  const response = await fetch(`${SOUNDRAW_API_BASE_URL}/accounts`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Soundraw API error: ${response.status} - ${errorText}`);
  }

  return await response.json() as { message: string };
}

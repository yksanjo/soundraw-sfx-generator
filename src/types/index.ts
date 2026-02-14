import { z } from 'zod';

// SFX Categories for game sound effects
export const SFX_CATEGORIES = [
  'combat',
  'ui',
  'ambient',
  'nature',
  'mechanical',
  'magical',
  'footsteps',
  'impacts',
  'vehicles',
  'weather',
] as const;

export const SFX_CATEGORY_VALUES = SFX_CATEGORIES;

// Soundraw-compatible moods for SFX
export const SFX_MOODS = [
  'Dark',
  'Epic',
  'Happy',
  'Scary',
  'Funny & Weird',
  'Peaceful',
  'Suspense',
  'Tense',
] as const;

// Soundraw-compatible genres for SFX
export const SFX_GENRES = [
  'Orchestra',
  'Electronica',
  'Ambient',
  'Rock',
  'Acoustic',
] as const;

// Input schema for SFX generation
export const GenerateSfxInput = z.object({
  description: z.string().describe('Description of the sound effect (e.g., "sword swing whoosh")'),
  category: z.enum(SFX_CATEGORIES).optional().describe('SFX category for better parameter mapping'),
  duration_seconds: z.number().min(1).max(30).optional().describe('Duration in seconds (1-30)'),
  intensity: z.enum(['low', 'medium', 'high']).optional().describe('Intensity level'),
  engine: z.enum(['unreal', 'unity', 'godot']).optional().describe('Game engine for integration code'),
  file_format: z.enum(['m4a', 'mp3', 'wav']).optional().describe('Audio file format'),
});

export type GenerateSfxInput = z.infer<typeof GenerateSfxInput>;

// Output schema for SFX generation
export interface SfxResult {
  share_link: string;
  audio_url: string;
  request_id: string;
  duration_seconds: number;
  bpm: number;
  file_format: string;
  integration_code?: string;
  deepseek_reasoning: string;
  soundraw_params: {
    moods: string[];
    genres: string[];
    themes: string[];
    tempo: string;
    energy_profile: string;
  };
}

// Variation input
export const SfxVariationInput = z.object({
  share_link: z.string().describe('Original SFX share_link'),
  variation_type: z.enum(['similar', 'softer', 'intense', 'reverse']).describe('Type of variation'),
  duration_seconds: z.number().min(1).max(30).optional().describe('Duration in seconds'),
});

export type SfxVariationInput = z.infer<typeof SfxVariationInput>;

// Batch generation input
export const SfxBatchInput = z.object({
  descriptions: z.array(z.string()).min(1).max(10).describe('Array of SFX descriptions to generate'),
  category: z.enum(SFX_CATEGORIES).optional().describe('Common category for all SFX'),
  duration_seconds: z.number().min(1).max(30).optional().describe('Duration for each SFX'),
  intensity: z.enum(['low', 'medium', 'high']).optional().describe('Intensity for all SFX'),
  engine: z.enum(['unreal', 'unity', 'godot']).optional().describe('Game engine for integration code'),
});

export type SfxBatchInput = z.infer<typeof SfxBatchInput>;

// DeepSeek response types
export interface DeepSeekSfxParams {
  moods: string[];
  genres: string[];
  themes: string[];
  tempo: 'low' | 'normal' | 'high';
  energy_profile: 'building' | 'steady' | 'climax' | 'ambient' | 'muted';
  reasoning: string;
}

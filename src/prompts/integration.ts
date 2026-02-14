// Engine-specific integration code templates for SFX

export function getUnrealSfxCode(audioUrl: string, sfxName: string): string {
  return `// Unreal Engine 5 - SFX Integration
// Download audio from: ${audioUrl}
// Rename file to: ${sfxName}.m4a

// 1. Import audio to Content Browser
// 2. Right-click → Create Cue → Sound Cue
// 3. Add to your Blueprint:

// C++ Implementation:
#include "Sound/SoundCue.h"
#include "Kismet/GameplayStatics.h"

void AMyCharacter::PlayFootstep()
{
    static USoundCue* FootstepCue = LOAD_ASSET("/Game/Audio/Footsteps/${sfxName}");
    if (FootstepCue)
    {
        UGameplayStatics::PlaySoundAtLocation(this, FootstepCue, GetActorLocation());
    }
}

// For 3D spatial audio:
UGameplayStatics::PlaySoundAtLocation(
    this,
    FootstepCue,
    GetActorLocation(),
    1.0f,  // Volume
    1.0f,  // Pitch
    0.0f,  // StartTime
    nullptr, // Attenuation
    nullptr  // Concurrency
);`;
}

export function getUnitySfxCode(audioUrl: string, sfxName: string): string {
  return `// Unity - SFX Integration
// Download audio from: ${audioUrl}
// Save as: ${sfxName}.m4a

using UnityEngine;

public class SFXManager : MonoBehaviour
{
    [Header("SFX Clips")]
    [SerializeField] private AudioClip ${sfxName.replace(/[^a-zA-Z]/g, '')}Clip;

    // Play one-shot (doesn't interrupt)
    public void Play${sfxName.replace(/[^a-zA-Z]/g, '')}()
    {
        if (${sfxName.replace(/[^a-zA-Z]/g, '')}Clip != null)
        {
            AudioSource.PlayClipAtPoint(
                ${sfxName.replace(/[^a-zA-Z]/g, '')}Clip,
                Camera.main.transform.position
            );
        }
    }

    // Play with custom volume
    public void Play${sfxName.replace(/[^a-zA-Z]/g, '')}(float volume = 1.0f)
    {
        if (${sfxName.replace(/[^a-zA-Z]/g, '')}Clip != null)
        {
            AudioSource.PlayClipAtPoint(
                ${sfxName.replace(/[^a-zA-Z]/g, '')}Clip,
                Camera.main.transform.position,
                volume
            );
        }
    }

    // Random pitch variation (for variety)
    public void PlayRandomPitch()
    {
        if (${sfxName.replace(/[^a-zA-Z]/g, '')}Clip != null)
        {
            AudioSource source = gameObject.AddComponent<AudioSource>();
            source.clip = ${sfxName.replace(/[^a-zA-Z]/g, '')}Clip;
            source.pitch = Random.Range(0.9f, 1.1f);
            source.Play();
            Destroy(source, source.clip.length);
        }
    }
}`;
}

export function getGodotSfxCode(audioUrl: string, sfxName: string): string {
  return `# Godot 4 - SFX Integration
# Download audio from: ${audioUrl}
# Save as: ${sfxName}.m4a

extends Node

@export var sfx_bus: StringName = "SFX"

func _ready():
    # Preload SFX if needed
    pass

func play_${sfxName.toLowerCase().replace(/[^a-z0-9]/g, '_')}():
    var player = AudioStreamPlayer.new()
    player.bus = sfx_bus
    # Load your audio file into the player stream
    # player.stream = load("res://audio/${sfxName}.m4a")
    add_child(player)
    player.play()
    player.finished.connect(player.queue_free)

func play_3d_${sfxName.toLowerCase().replace(/[^a-z0-9]/g, '_')}(position: Vector3):
    var player = AudioStreamPlayer3D.new()
    player.bus = sfx_bus
    player.position = position
    # player.stream = load("res://audio/${sfxName}.m4a")
    add_child(player)
    player.play()
    player.finished.connect(player.queue_free)

# With volume control
func play_with_volume_${sfxName.toLowerCase().replace(/[^a-z0-9]/g, '_')}(volume_db: float = 0.0):
    var player = AudioStreamPlayer.new()
    player.bus = sfx_bus
    player.volume_db = volume_db
    # player.stream = load("res://audio/${sfxName}.m4a")
    add_child(player)
    player.play()
    player.finished.connect(player.queue_free)`;
}

export function getSfxIntegrationCode(
  engine: 'unreal' | 'unity' | 'godot' | undefined,
  audioUrl: string,
  sfxName: string
): string | undefined {
  if (!engine) return undefined;

  switch (engine) {
    case 'unreal':
      return getUnrealSfxCode(audioUrl, sfxName);
    case 'unity':
      return getUnitySfxCode(audioUrl, sfxName);
    case 'godot':
      return getGodotSfxCode(audioUrl, sfxName);
    default:
      return undefined;
  }
}

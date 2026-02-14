# Soundraw SFX Generator MCP Server

An MCP (Model Context Protocol) server for generating game sound effects using DeepSeek for intelligent parameter mapping and Soundraw B2B API V3 for audio generation.

## Architecture

```
AI Agent (Claude/Cursor)
    ↓ calls MCP tool
MCP Server (soundraw-sfx-generator)
    ↓ uses DeepSeek API for reasoning
DeepSeek analyzes SFX description
    ↓ generates Soundraw parameters
Soundraw API generates audio
    ↓ async: returns request_id → poll for result
AI Agent receives audio_url + integration code
```

## Features

- **Smart Parameter Mapping**: DeepSeek translates descriptions to Soundraw parameters
- **10 SFX Categories**: Combat, UI, Nature, Mechanical, Magical, Footsteps, Impacts, Vehicles, Weather, Ambient
- **Short-Form Audio**: Optimized for 1-30 second sound effects
- **Engine Integration**: Auto-generated code for Unreal, Unity, Godot
- **Variation Generation**: Create softer/intense/reverse variations

## Installation

```bash
git clone https://github.com/yksanjo/soundraw-sfx-generator.git
cd soundraw-sfx-generator
npm install
npm run build
```

## Configuration

Create a `.env` file:

```env
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
SOUNDRAW_API_KEY=your-soundraw-bearer-token
```

## MCP Tool

### `generate_sfx`

Generate game sound effects based on description.

**Input:**
```json
{
  "description": "sword swing whoosh",
  "category": "combat",
  "duration_seconds": 3,
  "intensity": "high",
  "engine": "unity",
  "file_format": "m4a"
}
```

**Output:**
```json
{
  "share_link": "https://soundraw.io/edit_music?m=...",
  "audio_url": "https://..../final_xxx.m4a",
  "request_id": "...",
  "duration_seconds": 3,
  "bpm": 140,
  "file_format": "m4a",
  "integration_code": "// Unity SFX integration code...",
  "deepseek_reasoning": "Sword swing needs epic, high tempo...",
  "soundraw_params": {
    "moods": ["Epic"],
    "genres": ["Electronica"],
    "themes": ["Gaming"],
    "tempo": "high",
    "energy_profile": "climax"
  }
}
```

## SFX Categories

| Category | Description | Example Sounds |
|----------|-------------|----------------|
| combat | Fighting sounds | Sword swing, punch, magic blast |
| ui | Interface sounds | Click, hover, success chime |
| ambient | Background ambience | Wind, water, cave echo |
| nature | Natural sounds | Birds, rain, thunder |
| mechanical | Machine sounds | Engine, gears, clicks |
| magical | Fantasy sounds | Sparkle, whoosh, teleport |
| footsteps | Movement sounds | Grass, stone, wood steps |
| impacts | Collision sounds | Crash, bang, explosion |
| vehicles | Transportation | Engine, horn, brake |
| weather | Atmospheric | Rain, thunder, wind |

## Usage with Claude Code

Add to `~/.mcp.json`:

```json
{
  "mcpServers": {
    "soundraw-sfx-generator": {
      "command": "node",
      "args": ["/path/to/soundraw-sfx-generator/dist/index.js"],
      "env": {
        "DEEPSEEK_API_KEY": "sk-your-key",
        "SOUNDRAW_API_KEY": "your-bearer-token"
      }
    }
  }
}
```

Then try:
```
Generate a sword swing whoosh sound effect, 3 seconds, with Unity integration code
```

## Development

```bash
npm run dev        # Development mode
npm run build      # Build
npm run typecheck  # Type check
npm start         # Run built version
```

## Cost

| Component | Purpose | Cost |
|-----------|---------|------|
| DeepSeek | SFX parameter analysis | ~$0.001/request |
| Soundraw | Audio generation | Per your B2B plan |

## License

MIT

# Obsidian AI Journaling Assistant Plugin

## Overview

An Obsidian plugin that enhances the journaling experience with AI-powered features including daily prompts, chat interactions, voice transcription, and session summarization. The plugin creates a seamless integration between traditional journaling and AI assistance.

## Tech Stack

- Framework: Obsidian Plugin API
- Language: TypeScript
- AI Integration: OpenAI API (GPT-4 and Whisper)
- Core Libraries:
  - obsidian: Core Obsidian API functionality
  - openai: OpenAI API integration

Brief explanation of technology choices:

- Obsidian Plugin API: Required for deep integration with Obsidian's core functionality
- TypeScript: Provides type safety and better development experience for complex plugin architecture
- OpenAI API: Offers state-of-the-art language models for AI interactions and audio transcription

## Core Functionalities

### 1. Daily Journal Management

Detailed description:
Manages the creation and organization of daily journal entries with AI-generated prompts based on past entries.

#### User Interactions

- User can create a new journal entry for the current day
- User can access past journal entries
- System automatically generates contextual prompts based on previous entries
- User can write responses in a dedicated section

#### Technical Requirements

- File system operations for journal creation and management
- Date handling for entry organization
- Integration with OpenAI API for journal prompt generation
- Settings management for journal folder location

### 2. AI Chat Integration

Detailed description:
Enables interactive conversations with AI within journal entries, providing guidance and reflection assistance.

#### User Interactions

- User can initiate AI chat from the ribbon menu or command palette
- AI responds contextually based on journal content
- Chat history is preserved within the journal entry
- Streaming responses for real-time interaction

#### Technical Requirements

- OpenAI API integration for chat functionality
- Streaming response handling
- Context management for meaningful interactions
- Error handling for API failures

### 3. Voice Recording Transcription

Detailed description:
Transcribes voice recordings embedded in journal entries using OpenAI's Whisper API.

#### User Interactions

- User can transcribe embedded audio recordings
- Transcriptions are inserted directly into the journal entry
- Supports multiple audio formats
- Progress feedback during transcription

#### Technical Requirements

- Whisper API integration
- Audio file handling
- MIME type management
- Progress notification system

### 4. Journal Summarization

Detailed description:
Provides AI-powered summarization of journal entries to extract key insights and patterns.

#### User Interactions

- User can request summary of current journal entry
- Summary preserves emotional tone and key insights
- Option for streaming or complete summary
- Original content backup in inputs folder

#### Technical Requirements

- OpenAI API integration for summarization
- Content processing and analysis
- Backup system for original content
- Streaming response handling

## Package Documentation

### OpenAI Integration

- Purpose: Handles all AI-related functionality including chat, transcription, and summarization
- Installation: Built into the plugin

#### Code Example

```typescript
// Making an OpenAI request
async makeOpenAIRequest(prompt: string, onChunk?: (chunk: string) => void): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${this.settings.openAIApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            stream: !!onChunk,
        }),
    });
    // ... handle response
}
```

### Obsidian Integration

- Purpose: Core plugin functionality and UI integration
- Installation: Built into the plugin

#### Code Example

```typescript
// Adding plugin commands
this.addCommand({
  id: "open-todays-journal",
  name: "Open Today's Journal",
  callback: async () => {
    await this.journalService.openTodaysJournal();
  },
});
```

## Project Structure

```bash
ai_journal/
├── main.ts                 # Plugin entry point
├── src/
│   ├── prompts/           # AI prompt templates
│   ├── services/          # Core functionality services
│   ├── settings/          # Plugin settings management
│   └── types.ts           # TypeScript type definitions
```

## ⚠️ Common Gotchas

- Always handle API errors gracefully with user notifications
- Handle streaming responses properly
- Backup original content before AI summarization
- Validate API key before operations

## 🔍 Checklist Before Using with Cursor

- [ ] All core functionalities are clearly defined
- [ ] Working code examples are included
- [ ] File structure is documented
- [ ] All required packages are listed with installation instructions
- [ ] Environment variables are documented
- [ ] API endpoints and responses are documented
- [ ] Error handling scenarios are covered
- [ ] UI/UX requirements are specified

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
  - Currently using model: gpt-4o-mini

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
- System generates AI prompts based on past entries (configurable number of entries)
- Entries are organized by date (YYYY-MM-DD format)
- User responses are separated into dedicated sections
- Past entries are used for context in new prompts

#### Technical Requirements

- File system operations for journal creation and management
- Date handling for entry organization (YYYY-MM-DD format)
- Integration with OpenAI API for contextual prompt generation
- Settings management for journal folder location and past entries count
- Streaming response support for real-time prompt generation

### 2. AI Chat Integration

Detailed description:
Enables interactive conversations with AI within journal entries, providing guidance and reflection assistance.

#### User Interactions

- User can initiate AI chat from ribbon menu or command palette
- Chat responses are appended to the current note
- Supports streaming responses for real-time interaction
- Maintains conversation context within the note

#### Technical Requirements

- OpenAI API integration with streaming support
- Chat prompt management
- Error handling for API failures
- Integration with transcription service for audio content

### 3. Voice Recording Transcription

Detailed description:
Transcribes voice recordings embedded in journal entries using OpenAI's Whisper API, with automatic format conversion for better compatibility.

#### User Interactions

- User can transcribe embedded audio recordings
- Supports multiple audio formats (flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm)
- Automatic conversion of m4a files to WAV format for better compatibility
- Transcriptions replace audio embeds in the note
- Progress feedback during transcription

#### Technical Requirements

- Whisper API integration
- Audio file format validation and conversion
- Web Audio API for format conversion
- MIME type management
- Progress notification system
- Error handling for failed transcriptions or conversions
- Separation of concerns:
  - Audio processing (format conversion)
  - Transcription service (Whisper API interaction)

### 4. Journal Summarization

Detailed description:
Provides AI-powered summarization of journal entries to extract key insights and patterns.

#### User Interactions

- User can request summary of current journal entry
- Summaries focus on key insights and patterns
- Support for streaming or complete summary responses
- Original content backup in inputs folder
- Automatic transcription of audio before summarization

#### Technical Requirements

- OpenAI API integration for summarization
- Content processing and analysis
- Backup system for original content
- Streaming response handling
- Integration with transcription service

## Settings Management

- Journal folder location configuration
- Inputs folder for content backups
- OpenAI API key management
- Number of past entries to consider (0-10)
- Toggle for streaming responses

## Project Structure

```bash
ai_journal/
├── main.ts                    # Plugin entry point
├── src/
│   ├── core/
│   │   ├── ai/
│   │   │   ├── prompts/      # AI prompt templates
│   │   │   └── services/     # AI service implementations (OpenAI, Whisper)
│   │   ├── journal/          # Journal management
│   │   ├── summary/          # Summarization services
│   │   └── transcription/    # Audio transcription & processing
│   ├── interfaces/           # TypeScript interfaces
│   ├── settings/            # Plugin settings
│   ├── types.ts             # TypeScript types
│   └── utils/               # Helper functions
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

# Obsidian AI Journaling Assistant

An intelligent journaling companion for Obsidian that enhances your writing experience with AI-powered features, voice transcription, and insightful summaries.

## ✨ Features

### 🎯 Smart Daily Journaling

- Automatically generates thoughtful prompts based on your past entries
- Creates and organizes daily journal entries
- Maintains context between entries for more meaningful reflections

### 🤖 AI Chat Companion

- Have interactive conversations within your journal entries
- Get guidance and reflection assistance
- Real-time responses for natural conversation flow

### 🎙️ Voice Recording Transcription

- Automatically transcribe voice recordings in your notes
- Supports multiple audio formats (mp3, m4a, wav, etc.)
- Seamlessly converts recordings to text for easy reference
- Transcription happens automatically when using AI features
  - No need to manually transcribe before using Chat or Summary features
  - The plugin detects and processes recordings as needed

### 📝 Journal Summarization

- Get AI-powered summaries of your journaling sessions
- Extract key insights and patterns
- Preserve important reflections and realizations

## 🚀 Getting Started

### Prerequisites

- Obsidian v0.15.0 or higher
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "AI Journaling Assistant"
4. Install the plugin
5. Enable the plugin in your Community Plugins list

### Configuration

1. Open Settings → AI Journaling Assistant
2. Enter your OpenAI API key
3. Configure your preferred:
   - Journal folder location
   - Number of past entries to consider (0-10)
   - Streaming response preference

## 📖 How to Use

### Creating a Daily Journal

1. Click the robot icon in the ribbon menu
2. Select "Open Today's Journal"
3. The plugin will create a new entry with an AI-generated prompt

### Using Voice Recordings

1. Add a voice recording to your note using Obsidian's attachment feature
2. The plugin will automatically detect supported audio files
3. You can either:
   - Use "Transcribe Recordings" command for manual transcription
   - Simply use Chat or Summary features - they'll handle transcription automatically

### Chatting with AI

1. Open any note (with or without voice recordings)
2. Click the robot icon and select "Chat with AI"
3. The plugin will automatically transcribe any recordings if present
4. Start your conversation with the AI assistant

### Summarizing Sessions

1. After writing in your journal (text or voice recordings)
2. Click "Summarize Journaling Session" from the ribbon menu
3. Any voice recordings will be automatically transcribed
4. The AI will analyze your entry and provide meaningful insights

## ⚙️ Commands

- `Open Today's Journal`: Creates/opens your daily journal entry
- `Chat with AI`: Start an AI conversation in your current note (auto-transcribes recordings if present)
- `Transcribe Recordings`: Manually convert audio recordings to text
- `Summarize Journaling Session`: Get insights from your current entry (auto-transcribes recordings if present)

## 🤝 Support

If you encounter any issues or have suggestions:

- Check the [GitHub Issues](https://github.com/yourusername/obsidian-ai-journaling-assistant/issues)
- Create a new issue with detailed information about your problem

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the Obsidian community
- Powered by OpenAI's GPT and Whisper APIs
- Inspired by the practice of mindful journaling

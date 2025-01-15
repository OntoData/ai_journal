# Obsidian AI Journaling Assistant

An intelligent journaling companion for Obsidian that makes self-reflection fun and helpful with AI-powered features, voice transcription, and insightful summaries.

## 👥 Who Is This For

The **Obsidian AI Journaling Assistant** is made for anyone who wants to make digital journaling a habit using Obsidian. Here’s who will especially love this tool:

- **Digital Journal Lovers**  
  If you want to keep your journal on your computer or mobile device, this tool helps you organize and save your entries easily.

- **Voice Journalers**  
  If you like talking more than writing, you can record your voice and have it turned into text.

- **Self-Reflectors**  
  If you want to think deeper about your day and feelings, the AI helps you explore your thoughts by asking deep questions and giving you summaries to understand your thoughts better.

- **Busy People**  
  If you have a tight schedule, this tool makes journaling quick and easy with smart prompts.

- **Language Users**  
  If you like to write in English or Polish, you can choose your language and make journaling comfortable for you.

- **Privacy Keepers**  
  If keeping your thoughts private is important, your journal stays on your computer.

The **Obsidian AI Journaling Assistant** is here to make journaling simple, fun, and helpful for everyone.

## ✨ Features

### 🎯 Smart Daily Journaling

- Automatically generates jounaling prompt based on your past entries
- Creates and organizes daily journal entries
- Maintains context between entries for more meaningful reflections

![daily journal gif](https://github.com/user-attachments/assets/5d136d07-a50c-4fe1-bed4-6da1560f8d1f)

### 🤖 AI Chat Companion

- Have interactive conversations within your journal entries. Two options supported:
  - Write your journal entry
  - Record your voice to have a conversation with the AI
- Get guidance and reflection assistance
  ![chat gif](https://github.com/user-attachments/assets/5f1f27cc-ba2c-4af2-b1a6-4ccf7b85c982)

### 📝 Journal Summarization

- Get AI-powered summaries of your journaling sessions
- Extract key insights and patterns
- Preserve important reflections and realizations
  ![summary gif](https://github.com/user-attachments/assets/a7b73994-f8d7-4d53-8e60-1c492839691a)

### 🎙️ Voice Recording Transcription

- Automatically transcribe voice recordings in your notes
- Supports multiple audio formats (mp3, m4a, wav, etc.) - works both on desktop and mobile
- Seamlessly converts recordings to text for easy reference
- Transcription happens automatically when using AI features (Chat or Summary)
  - No need to manually transcribe before using Chat or Summary features
  - The plugin detects and processes recordings as needed
    ![transcription gif](https://github.com/user-attachments/assets/f8eee955-c663-452c-9da7-b5df601ff3dc)

### 🌐 Language Support & Custom Prompts

- Support for multiple languages (English and Polish)
- Choose between default or custom prompts
- Create and use your own prompt templates
- Easy language switching from settings

## 🚀 Getting Started

### Prerequisites

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
   - Number of past entries to consider (0-10) when generating journal prompt
   - Streaming response preference
   - Language (English/Polish)
   - Custom prompts (optional)

### Using Custom Prompts

1. Create your prompt files in Markdown format
2. Enable "Use Custom Prompts" in settings
3. Set paths to your custom prompt files:
   - Journal prompt
   - Chat prompt
   - Summary prompt

## 📖 How to Use

### Creating a Daily Journal

1. Click the robot icon in the ribbon menu
2. Select "Open Today's Journal"
3. The plugin will create a new entry with a starter prompt based on your past entries

### Using Voice Recordings

1. Add a voice recording to your note using Obsidian's `Start/stop recording` (Audio Recorder) core plugin
2. You can either:
   - Use "Transcribe Recordings" command for manual transcription
   - Simply use Chat or Summary features - they'll handle transcription automatically

### Chatting with AI

1. Open journal entry (with or without voice recordings)
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

- Create a new issue with detailed information about your problem

Enjoy your journaling journey!

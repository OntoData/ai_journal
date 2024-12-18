import { Notice, MarkdownView, TFile } from 'obsidian';
import { AudioTranscriber } from '../audioTranscriber';
import type { App } from 'obsidian';
import type { JournalingAssistantSettings } from '../types';

export class TranscriptionService {
    constructor(
        private app: App,
        private settings: JournalingAssistantSettings
    ) {}

    async transcribeRecordings(): Promise<void> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('Please open a note first');
            return;
        }

        if (!this.settings.openAIApiKey) {
            new Notice('OpenAI API key not configured');
            return;
        }

        const editor = activeView.editor;
        const content = editor.getValue();
        const recordingPattern = AudioTranscriber.getRecordingEmbedPattern();
        const recordings = content.match(recordingPattern);

        if (!recordings || recordings.length === 0) {
            new Notice('No recordings found in the current note');
            return;
        }

        new Notice('Starting transcription...');

        const transcriber = new AudioTranscriber(this.app.vault, this.settings.openAIApiKey);
        let updatedContent = content;

        try {
            for (const recording of recordings) {
                const fileName = recording.slice(3, -2); // Remove ![[...]]
                const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
                
                if (file instanceof TFile) {
                    const transcript = await transcriber.transcribeFile(file);
                    updatedContent = updatedContent.replace(recording, transcript);
                }
            }

            editor.setValue(updatedContent);
            new Notice('Transcription completed successfully');
        } catch (error) {
            new Notice(`Transcription failed: ${error.message}`);
            console.error('Transcription error:', error);
        }
    }
} 
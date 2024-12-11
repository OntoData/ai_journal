import { App, Plugin, PluginSettingTab, Setting, Notice, MarkdownView, TFile } from 'obsidian';
import { JournalingAssistantSettings, DEFAULT_SETTINGS } from './src/types';
import { AudioTranscriber } from './src/audioTranscriber';

export default class JournalingAssistantPlugin extends Plugin {
    settings: JournalingAssistantSettings;

    async onload() {
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new JournalingAssistantSettingTab(this.app, this));

        // Add ribbon icon
        this.addRibbonIcon('bot', 'Journal with AI', async () => {
            await this.openTodaysJournal();
        });

        // Add command for opening today's journal
        this.addCommand({
            id: 'open-todays-journal',
            name: 'Open Today\'s Journal',
            callback: async () => {
                await this.openTodaysJournal();
            },
        });

        // Add command for transcribing recordings
        this.addCommand({
            id: 'transcribe-recordings',
            name: 'Transcribe Recordings',
            callback: async () => {
                await this.transcribeRecordings();
            },
        });

        // Add command for summarizing journaling session
        this.addCommand({
            id: 'summarize-journal',
            name: 'Summarize Journaling Session',
            callback: async () => {
                await this.summarizeJournalingSession();
            },
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        console.log("Unloading Journaling Assistant Plugin...");
    }

    private getTodayFileName(): string {
        const date = new Date();
        return date.toISOString().split('T')[0] + '.md'; // Format: YYYY-MM-DD.md
    }

    private async ensureJournalFolder(): Promise<void> {
        const folderPath = this.settings.journalFolder;
        if (!(await this.app.vault.adapter.exists(folderPath))) {
            await this.app.vault.createFolder(folderPath);
        }
    }

    private async getPastJournalEntries(count: number): Promise<string[]> {
        const folder = this.app.vault.getAbstractFileByPath(this.settings.journalFolder);
        if (!folder) return [];

        const files = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.startsWith(this.settings.journalFolder + '/'))
            .sort((a, b) => b.stat.mtime - a.stat.mtime)
            .slice(0, count);

        const entries = await Promise.all(
            files.map(async file => {
                const content = await this.app.vault.read(file);
                return {
                    date: file.basename,
                    content: content
                };
            })
        );

        return entries.map(entry => `Date: ${entry.date}\n${entry.content}`);
    }

    private async generatePromptWithAI(pastEntries: string[]): Promise<string> {
        if (!this.settings.openAIApiKey) {
            new Notice('OpenAI API key not configured. Please add your API key in settings.');
            throw new Error('OpenAI API key not configured');
        }

        const prompt = `Based on these past journal entries:\n\n${pastEntries.join('\n\n---\n\n')}\n\n${this.settings.defaultJournalingPrompt}`;
        
        // Add debug logging
        console.log('=== GPT API Call Debug ===');
        console.log('Past Entries Count:', pastEntries.length);
        console.log('Prompt:', prompt);
        console.log('API Key (first 4 chars):', this.settings.openAIApiKey.slice(0, 4));

        try {
            const requestBody = {
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.7,
            };
            
            // Log the request
            console.log('Request Body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openAIApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            
            // Log the response
            console.log('Response:', JSON.stringify(data, null, 2));
            
            if (!response.ok) {
                console.error('OpenAI API error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: data.error
                });
                const errorMessage = data.error?.message || 'API request failed';
                new Notice(`OpenAI API Error: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API error:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            
            // Show a user-friendly error message
            const userMessage = error.message.includes('Failed to fetch') 
                ? 'Cannot connect to OpenAI API. Please check your internet connection.'
                : `Error: ${error.message}`;
            new Notice(userMessage);
            
            throw new Error('Failed to generate prompt: ' + error.message);
        }
    }

    private async openTodaysJournal(): Promise<void> {
        try {
            await this.ensureJournalFolder();

            const fileName = this.getTodayFileName();
            const filePath = `${this.settings.journalFolder}/${fileName}`;
            
            // Add debug logging
            console.log('Opening journal with:', {
                fileName,
                filePath,
                journalFolder: this.settings.journalFolder
            });
            
            let file = this.app.vault.getAbstractFileByPath(filePath);

            if (!file) {
                // Only generate prompt if creating a new file
                let initialContent = `# Journal Entry - ${new Date().toLocaleDateString()}\n\n`;
                
                try {
                    const pastEntries = await this.getPastJournalEntries(this.settings.numberOfPastEntries);
                    if (pastEntries.length > 0) {
                        const aiPrompt = await this.generatePromptWithAI(pastEntries);
                        initialContent += `## Today's Prompt\n\n${aiPrompt}\n\n## Your Journal Response\n\n`;
                    } else {
                        initialContent += `## Your Journal Response\n\n`;
                    }
                } catch (error) {
                    new Notice('Error generating prompt: ' + error.message);
                    initialContent += `## Your Journal Response\n\n`;
                }

                file = await this.app.vault.create(filePath, initialContent);
                new Notice('Created new journal entry for today');
            }

            const leaf = this.app.workspace.getLeaf(false);
            await leaf.openFile(file as TFile);

        } catch (error) {
            new Notice('Error opening today\'s journal: ' + error.message);
            console.error('Error opening today\'s journal:', error);
        }
    }

    private async transcribeRecordings(): Promise<void> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('Please open a note first');
            return;
        }

        if (!this.settings.openAIApiKey) {
            new Notice('OpenAI API key not configured. Please add your API key in settings.');
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
                
                // Add logging
                console.log('Processing recording:', {
                    originalLink: recording,
                    parsedFileName: fileName,
                    resolvedFile: file?.path
                });

                if (file instanceof TFile) {
                    console.log('Sending transcription request for:', file.path);
                    const transcript = await transcriber.transcribeFile(file);
                    console.log('Received transcription:', transcript);
                    
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

    private async summarizeJournalingSession(): Promise<void> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('Please open a note first');
            return;
        }

        if (!this.settings.openAIApiKey) {
            new Notice('OpenAI API key not configured');
            return;
        }

        if (!activeView.file) {
            new Notice('No file is currently open');
            return;
        }

        try {
            // Save original content to inputs folder
            const originalContent = activeView.editor.getValue();
            const fileName = activeView.file.name;
            const inputPath = `${this.settings.inputsFolder}/${fileName}`;
            
            await this.ensureFolder(this.settings.inputsFolder);
            await this.app.vault.create(inputPath, originalContent);

            // Process content (transcribe recordings if any)
            let processedContent = originalContent;
            const recordingPattern = AudioTranscriber.getRecordingEmbedPattern();
            const recordings = originalContent.match(recordingPattern);

            if (recordings) {
                const transcriber = new AudioTranscriber(this.app.vault, this.settings.openAIApiKey);
                for (const recording of recordings) {
                    const fileName = recording.slice(3, -2);
                    const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
                    
                    if (file instanceof TFile) {
                        const transcript = await transcriber.transcribeFile(file);
                        processedContent = processedContent.replace(recording, transcript);
                    }
                }
            }

            // Extract user's response section
            const responseMatch = processedContent.match(/## Your Journal Response\n\n([\s\S]*$)/);
            if (!responseMatch) {
                new Notice('Could not find journal response section');
                return;
            }

            const userResponse = responseMatch[1];
            
            // Generate summary using GPT
            const summary = await this.generateSummaryWithAI(userResponse);

            // Replace response with summary
            const updatedContent = processedContent.replace(
                /## Your Journal Response\n\n[\s\S]*$/,
                `## Your Journal Response\n\n${summary}`
            );

            // Update the note
            activeView.editor.setValue(updatedContent);
            new Notice('Journal session summarized');

        } catch (error) {
            new Notice(`Error: ${error.message}`);
            console.error('Summarization error:', error);
        }
    }

    private async generateSummaryWithAI(content: string): Promise<string> {
        try {
            const requestBody = {
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: `${this.settings.defaultSummarizationPrompt}\n\n${content}`
                }],
                temperature: 0.7,
            };

            // Log the request
            console.log('=== GPT Summary API Call ===');
            console.log('Request:', {
                prompt: this.settings.defaultSummarizationPrompt,
                content: content.slice(0, 100) + '...', // First 100 chars for brevity
                fullBody: requestBody
            });

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openAIApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            
            // Log the response
            console.log('Response:', {
                status: response.status,
                statusText: response.statusText,
                data: data
            });

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to generate summary');
            }

            return data.choices[0].message.content;

        } catch (error) {
            console.error('Summary generation error:', error);
            throw new Error('Failed to generate summary: ' + error.message);
        }
    }

    private async ensureFolder(folderPath: string): Promise<void> {
        if (!(await this.app.vault.adapter.exists(folderPath))) {
            await this.app.vault.createFolder(folderPath);
        }
    }
}

class JournalingAssistantSettingTab extends PluginSettingTab {
    plugin: JournalingAssistantPlugin;

    constructor(app: App, plugin: JournalingAssistantPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Journaling Assistant Settings' });

        new Setting(containerEl)
            .setName('Journal Folder')
            .setDesc('The folder where your journal entries will be stored')
            .addText(text => text
                .setPlaceholder('Journal')
                .setValue(this.plugin.settings.journalFolder)
                .onChange(async (value) => {
                    this.plugin.settings.journalFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Journal Inputs Folder')
            .setDesc('The folder where your journal inputs will be stored')
            .addText(text => text
                .setPlaceholder('Inputs')
                .setValue(this.plugin.settings.inputsFolder)
                .onChange(async (value) => {
                    this.plugin.settings.inputsFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('Your OpenAI API key for generating prompts, summaries, and transcriptions')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openAIApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openAIApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Default Journaling Prompt')
            .setDesc('The default prompt used to generate journaling questions')
            .addTextArea(text => text
                .setPlaceholder('Generate a thought-provoking journaling prompt for today.')
                .setValue(this.plugin.settings.defaultJournalingPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.defaultJournalingPrompt = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Default Summarization Prompt')
            .setDesc('The default prompt used to generate journal entry summaries')
            .addTextArea(text => text
                .setPlaceholder('Summarize the key points and insights from this journal entry.')
                .setValue(this.plugin.settings.defaultSummarizationPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.defaultSummarizationPrompt = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Number of Past Entries')
            .setDesc('Number of past journal entries to consider when generating prompts')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.numberOfPastEntries)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.numberOfPastEntries = value;
                    await this.plugin.saveSettings();
                }));
    }
}

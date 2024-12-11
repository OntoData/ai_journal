import { App, Plugin, PluginSettingTab, Setting, Notice, MarkdownView, TFile } from 'obsidian';
import { JournalingAssistantSettings, DEFAULT_SETTINGS } from './src/types';

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

    private insertHelloWorld() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            editor.replaceSelection("Hello World");
        } else {
            // If there's no active markdown editor (e.g., no note open), do nothing or show a notice.
            new Notice("No active note is open.");
        }
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
                throw new Error(data.error?.message || 'API request failed');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error('Failed to generate prompt: ' + error.message);
        }
    }

    private async openTodaysJournal(): Promise<void> {
        try {
            await this.ensureJournalFolder();

            const fileName = this.getTodayFileName();
            const filePath = `${this.settings.journalFolder}/${fileName}`;
            let file = this.app.vault.getAbstractFileByPath(filePath);

            // Get past entries and generate prompt
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

            if (!file) {
                file = await this.app.vault.create(filePath, initialContent);
                new Notice('Created new journal entry for today');
            }

            const leaf = this.app.workspace.getUnpinnedLeaf();
            await leaf.openFile(file as TFile);

        } catch (error) {
            new Notice('Error opening today\'s journal: ' + error.message);
            console.error('Error opening today\'s journal:', error);
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
            .setName('Summaries Folder')
            .setDesc('The folder where your journal summaries will be stored')
            .addText(text => text
                .setPlaceholder('Summaries')
                .setValue(this.plugin.settings.summariesFolder)
                .onChange(async (value) => {
                    this.plugin.settings.summariesFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('Your OpenAI API key for generating prompts and summaries')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openAIApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openAIApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Whisper API Key')
            .setDesc('Your Whisper API key for voice-to-text functionality')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.whisperApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.whisperApiKey = value;
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

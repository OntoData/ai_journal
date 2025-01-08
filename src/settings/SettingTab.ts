import { App, PluginSettingTab, Setting } from 'obsidian';
import type { JournalingAssistantPlugin } from '../../main';

export class JournalingAssistantSettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: JournalingAssistantPlugin) {
        super(app, plugin);
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
            .setDesc('Your OpenAI API key for generating prompts and summaries')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openAIApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openAIApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Number of Past Entries')
            .setDesc('Number of past journal entries to consider when generating prompts')
            .addSlider(slider => slider
                .setLimits(0, 10, 1)
                .setValue(this.plugin.settings.numberOfPastEntries)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.numberOfPastEntries = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Use Streaming Response')
            .setDesc('Stream AI responses in real-time (recommended for better experience)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useStreamingResponse)
                .onChange(async (value) => {
                    this.plugin.settings.useStreamingResponse = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'Prompt Settings' });

        new Setting(containerEl)
            .setName('Use Custom Prompts')
            .setDesc('Toggle between default language prompts and custom prompts')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomPrompts)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomPrompts = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide relevant settings
                }));

        if (!this.plugin.settings.useCustomPrompts) {
            new Setting(containerEl)
                .setName('Language')
                .setDesc('Select prompt language')
                .addDropdown(dropdown => dropdown
                    .addOption('en', 'English')
                    .addOption('pl', 'Polish')
                    .setValue(this.plugin.settings.language)
                    .onChange(async (value: 'en' | 'pl') => {
                        this.plugin.settings.language = value;
                        await this.plugin.saveSettings();
                    }));
        } else {
            new Setting(containerEl)
                .setName('Journal Prompt File')
                .setDesc('Path to custom journal prompt file')
                .addText(text => text
                    .setPlaceholder('prompts/journal.md')
                    .setValue(this.plugin.settings.customPromptPaths.journal)
                    .onChange(async (value) => {
                        this.plugin.settings.customPromptPaths.journal = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Chat Prompt File')
                .setDesc('Path to custom chat prompt file')
                .addText(text => text
                    .setPlaceholder('prompts/chat.md')
                    .setValue(this.plugin.settings.customPromptPaths.chat)
                    .onChange(async (value) => {
                        this.plugin.settings.customPromptPaths.chat = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Summary Prompt File')
                .setDesc('Path to custom summary prompt file')
                .addText(text => text
                    .setPlaceholder('prompts/summary.md')
                    .setValue(this.plugin.settings.customPromptPaths.summary)
                    .onChange(async (value) => {
                        this.plugin.settings.customPromptPaths.summary = value;
                        await this.plugin.saveSettings();
                    }));
        }
    }
} 
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
    }
} 
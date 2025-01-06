import { App, TFile } from 'obsidian';
import { JournalingAssistantSettings } from '../../types';
import { getTodayFileName } from '../../utils/helpers';

export class JournalManager {
    constructor(
        private app: App,
        private settings: JournalingAssistantSettings
    ) {}

    async ensureFolder(folderPath: string): Promise<void> {
        if (!(await this.app.vault.adapter.exists(folderPath))) {
            await this.app.vault.createFolder(folderPath);
        }
    }

    getTodayFileName(): string {
        return getTodayFileName();
    }

    async getPastJournalEntries(count: number): Promise<string[]> {
        const folder = this.app.vault.getAbstractFileByPath(this.settings.journalFolder);
        if (!folder) return [];

        const files = this.app.vault.getMarkdownFiles()
            .filter(file => file.path.startsWith(this.settings.journalFolder + '/'))
            .sort((a, b) => b.stat.mtime - a.stat.mtime)
            .slice(1, count+1);

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

    async createNewJournalEntry(): Promise<TFile> {
        const fileName = this.getTodayFileName();
        const filePath = `${this.settings.journalFolder}/${fileName}`;
        const initialContent = `# Journal Entry - ${new Date().toLocaleDateString()}\n\n`;
        return await this.app.vault.create(filePath, initialContent);
    }
} 
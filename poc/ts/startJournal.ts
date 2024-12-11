import * as fs from 'fs';
import * as path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';

dotenvConfig(); // Load .env file

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;
if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set in environment.");
}
if (!OPENAI_PROJECT_ID) {
    throw new Error("OPENAI_PROJECT_ID not set in environment.");
}

const AI_JOURNAL_DIR = "ai_journal";

const INITIAL_PROMPT = `
Pełnisz rolę mojego przyjaciela i asystenta do refleksji w dzienniku. Chcę, abyś zadał mi serię pytań (około 10), które pomogą mi spojrzeć na dzisiejszy dzień z wielu perspektyw. W swojej odpowiedzi:

Zadaj 3 pytania dotyczące moich bieżących emocji i samopoczucia.
Zadaj 3 pytania związane z ważnymi wydarzeniami dzisiejszego dnia – za co jestem wdzięczny, co było smutne, co ekscytujące.
Zadaj 2 pytania nawiązujące do treści z poprzednich dni mojego dziennika, tak aby pomóc mi zobaczyć ciągłość lub zmiany w moich przeżyciach.
Zadaj 2 pytania kreatywne, które pomogą mi z innej perspektywy spojrzeć na te doświadczenia (np. wyobrażenie sobie przyszłości, hipotetyczne scenariusze).
Pamiętaj, by brzmieć serdecznie, personalnie i empatycznie.
`;

async function reflectOnJournal(previousNotesContent: string, modelName: string = 'gpt-4o'): Promise<string> {
    const configuration = new Configuration({
        apiKey: OPENAI_API_KEY
    });
    const openai = new OpenAIApi(configuration);

    const prompt = INITIAL_PROMPT + "\n\n" + previousNotesContent;
    const response = await openai.createChatCompletion({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
    });

    return response.data.choices?.[0]?.message?.content ?? '';
}

function getTimeOfDay(hour: number): string {
    if (hour < 12) {
        return "morning";
    } else if (hour < 19) {
        return "afternoon";
    } else {
        return "evening";
    }
}

function concatenateRecentJournalEntries(vaultFilePath: string): string {
    const currentTime = new Date();
    const journalEntries: string[] = [];

    const fullJournalPath = path.join(vaultFilePath, AI_JOURNAL_DIR);
    const files = fs.readdirSync(fullJournalPath);

    for (const filename of files) {
        const filePath = path.join(fullJournalPath, filename);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        const match = filename.match(/(\d{4})-(\d{2})-(\d{2})\.md/);
        if (match) {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const day = parseInt(match[3], 10);
            const fileDate = new Date(year, month - 1, day);

            const diffTime = currentTime.getTime() - fileDate.getTime();
            const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (daysAgo <= 7) {
                let daysAgoStr: string;
                if (daysAgo === 0) {
                    daysAgoStr = "today";
                } else if (daysAgo === 1) {
                    daysAgoStr = "yesterday";
                } else {
                    daysAgoStr = `${daysAgo} days ago`;
                }

                const timeOfDay = getTimeOfDay(fileDate.getHours());
                // get day name in English
                const dayName = fileDate.toLocaleDateString('en-US', { weekday: 'long' });

                const content = fs.readFileSync(filePath, 'utf-8');
                const annotatedContent = `--- ${daysAgoStr}, ${dayName}, ${timeOfDay} ---\n${content}\n`;
                journalEntries.push(annotatedContent);
            }
        }
    }

    return journalEntries.join("\n");
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: node main.js <vault_path> <current_note_path>");
        process.exit(1);
    }

    const vaultPath = args[0];
    const currentNotePath = args[1];

    const fullCurrentNotePath = path.join(vaultPath, currentNotePath);
    const recentJournalEntries = concatenateRecentJournalEntries(vaultPath);

    const reflection = await reflectOnJournal(recentJournalEntries);

    fs.writeFileSync(fullCurrentNotePath, reflection, { encoding: 'utf-8' });
    fs.appendFileSync(fullCurrentNotePath, "\n\n------ ODPOWIEDZI ------\n", { encoding: 'utf-8' });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

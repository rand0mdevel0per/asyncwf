import chalk from 'chalk';
import {
    listKnowledge,
    getKnowledge,
    learnKnowledge,
    searchKnowledge,
    deleteKnowledge
} from '../lib/knowledge.js';

interface KBOptions {
    topic?: string;
    content?: string;
    query?: string;
}

export async function kbCommand(
    action: string,
    options: KBOptions
): Promise<void> {
    switch (action) {
        case 'list':
            handleList();
            break;
        case 'show':
            handleShow(options);
            break;
        case 'learn':
            handleLearn(options);
            break;
        case 'search':
            handleSearch(options);
            break;
        case 'delete':
            handleDelete(options);
            break;
        default:
            console.log(chalk.red(`Unknown action: ${action}`));
    }
}

function handleList(): void {
    const entries = listKnowledge();

    if (entries.length === 0) {
        console.log(chalk.gray('No knowledge entries'));
        console.log(chalk.gray('\nLearn something with:'));
        console.log(chalk.gray('  asyncwf kb learn --topic <name> --content "..."'));
        return;
    }

    console.log(chalk.cyan(`🧠 Knowledge Base (${entries.length} entries):\n`));

    for (const entry of entries) {
        console.log(chalk.green(`• ${entry.topic}`));
        console.log(chalk.gray(`  Updated: ${entry.updated}`));
    }

    // Also output JSON
    console.log(chalk.gray('\n--- JSON ---'));
    console.log(JSON.stringify(entries, null, 2));
}

function handleShow(options: KBOptions): void {
    const { topic } = options;

    if (!topic) {
        console.log(chalk.red('Error: topic required'));
        return;
    }

    const entry = getKnowledge(topic);
    if (!entry) {
        console.log(chalk.red(`Error: Knowledge "${topic}" not found`));
        return;
    }

    console.log(chalk.cyan(`📖 Knowledge: ${entry.topic}\n`));
    console.log(chalk.gray(`Created: ${entry.created}`));
    console.log(chalk.gray(`Updated: ${entry.updated}`));
    console.log(chalk.gray(`Source: ${entry.source}`));
    console.log(chalk.gray('---'));
    console.log(entry.content);
}

function handleLearn(options: KBOptions): void {
    const { topic, content } = options;

    if (!topic || !content) {
        console.log(chalk.red('Error: --topic and --content are required'));
        return;
    }

    const entry = learnKnowledge(topic, content, 'model-learned');

    console.log(chalk.green(`✓ Knowledge learned: "${topic}"`));
    console.log(chalk.gray(`  Path: ${entry.filePath}`));
}

function handleSearch(options: KBOptions): void {
    const { query } = options;

    if (!query) {
        console.log(chalk.red('Error: search query required'));
        return;
    }

    const results = searchKnowledge(query);

    if (results.length === 0) {
        console.log(chalk.gray(`No results for "${query}"`));
        return;
    }

    console.log(chalk.cyan(`🔍 Search results for "${query}" (${results.length}):\n`));

    for (const entry of results) {
        console.log(chalk.green(`• ${entry.topic}`));
        // Show preview
        const preview = entry.content.slice(0, 100).replace(/\n/g, ' ');
        console.log(chalk.gray(`  ${preview}...`));
    }

    // Also output JSON
    console.log(chalk.gray('\n--- JSON ---'));
    console.log(JSON.stringify(results.map(r => ({
        topic: r.topic,
        updated: r.updated,
        source: r.source,
    })), null, 2));
}

function handleDelete(options: KBOptions): void {
    const { topic } = options;

    if (!topic) {
        console.log(chalk.red('Error: topic required'));
        return;
    }

    const success = deleteKnowledge(topic);

    if (success) {
        console.log(chalk.green(`✓ Knowledge "${topic}" deleted`));
    } else {
        console.log(chalk.red(`Error: Knowledge "${topic}" not found`));
    }
}

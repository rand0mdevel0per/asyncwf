import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { KnowledgeEntry, KnowledgeIndex } from '../types.js';

function getCKBDir(): string {
    return join(homedir(), '.ckb');
}

function getKnowledgeDir(): string {
    return join(getCKBDir(), 'knowledge');
}

function getKnowledgeIndexPath(): string {
    return join(getKnowledgeDir(), '_index.json');
}

export function ensureKnowledgeDir(): void {
    const dir = getKnowledgeDir();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const indexPath = getKnowledgeIndexPath();
    if (!existsSync(indexPath)) {
        writeFileSync(indexPath, JSON.stringify({ entries: [] }, null, 2));
    }
}

function getKnowledgeIndex(): KnowledgeIndex {
    ensureKnowledgeDir();
    const data = readFileSync(getKnowledgeIndexPath(), 'utf-8');
    return JSON.parse(data);
}

function saveKnowledgeIndex(index: KnowledgeIndex): void {
    writeFileSync(getKnowledgeIndexPath(), JSON.stringify(index, null, 2));
}

export function listKnowledge(): KnowledgeIndex['entries'] {
    return getKnowledgeIndex().entries;
}

export function getKnowledge(topic: string): KnowledgeEntry | null {
    const index = getKnowledgeIndex();
    const entry = index.entries.find(e => e.topic === topic);
    if (!entry) return null;

    const filePath = join(getKnowledgeDir(), `${topic}.md`);
    if (!existsSync(filePath)) return null;

    const content = readFileSync(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
        return {
            topic,
            created: entry.created,
            updated: entry.updated,
            source: 'model-learned',
            content,
            filePath,
        };
    }

    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];

    // Simple parsing
    const sourceMatch = frontmatter.match(/source:\s*(.+)/);

    return {
        topic,
        created: entry.created,
        updated: entry.updated,
        source: (sourceMatch ? sourceMatch[1].trim() : 'model-learned') as KnowledgeEntry['source'],
        content: body.trim(),
        filePath,
    };
}

export function learnKnowledge(
    topic: string,
    content: string,
    source: KnowledgeEntry['source'] = 'model-learned'
): KnowledgeEntry {
    ensureKnowledgeDir();

    const filePath = join(getKnowledgeDir(), `${topic}.md`);
    const now = new Date().toISOString().split('T')[0];

    // Check if exists for created date
    const existing = getKnowledgeIndex().entries.find(e => e.topic === topic);
    const created = existing?.created || now;

    // Create markdown with frontmatter
    const fullContent = `---
topic: ${topic}
created: ${created}
updated: ${now}
source: ${source}
---

${content}
`;

    writeFileSync(filePath, fullContent);

    // Update index
    const index = getKnowledgeIndex();
    const existingIndex = index.entries.findIndex(e => e.topic === topic);

    const entry = {
        topic,
        created,
        updated: now,
        filePath,
    };

    if (existingIndex >= 0) {
        index.entries[existingIndex] = entry;
    } else {
        index.entries.push(entry);
    }

    saveKnowledgeIndex(index);

    return {
        topic,
        created,
        updated: now,
        source,
        content,
        filePath,
    };
}

export function searchKnowledge(query: string): KnowledgeEntry[] {
    const index = getKnowledgeIndex();
    const results: KnowledgeEntry[] = [];
    const lowerQuery = query.toLowerCase();

    for (const entry of index.entries) {
        // Search in topic name
        if (entry.topic.toLowerCase().includes(lowerQuery)) {
            const kb = getKnowledge(entry.topic);
            if (kb) results.push(kb);
            continue;
        }

        // Search in content
        const filePath = join(getKnowledgeDir(), `${entry.topic}.md`);
        if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8').toLowerCase();
            if (content.includes(lowerQuery)) {
                const kb = getKnowledge(entry.topic);
                if (kb) results.push(kb);
            }
        }
    }

    return results;
}

export function deleteKnowledge(topic: string): boolean {
    const index = getKnowledgeIndex();
    const entryIndex = index.entries.findIndex(e => e.topic === topic);
    if (entryIndex === -1) return false;

    const filePath = join(getKnowledgeDir(), `${topic}.md`);
    if (existsSync(filePath)) {
        unlinkSync(filePath);
    }

    index.entries.splice(entryIndex, 1);
    saveKnowledgeIndex(index);

    return true;
}

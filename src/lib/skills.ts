import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import type { Skill, SkillsIndex } from '../types.js';

function getCKBDir(): string {
    return join(homedir(), '.ckb');
}

function getSkillsDir(): string {
    return join(getCKBDir(), 'skills');
}

function getSkillsIndexPath(): string {
    return join(getSkillsDir(), '_index.json');
}

export function ensureSkillsDir(): void {
    const dir = getSkillsDir();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const indexPath = getSkillsIndexPath();
    if (!existsSync(indexPath)) {
        writeFileSync(indexPath, JSON.stringify({ skills: [] }, null, 2));
    }
}

function getSkillsIndex(): SkillsIndex {
    ensureSkillsDir();
    const data = readFileSync(getSkillsIndexPath(), 'utf-8');
    return JSON.parse(data);
}

function saveSkillsIndex(index: SkillsIndex): void {
    writeFileSync(getSkillsIndexPath(), JSON.stringify(index, null, 2));
}

export function listSkills(): SkillsIndex['skills'] {
    return getSkillsIndex().skills;
}

export function getSkill(name: string): Skill | null {
    const index = getSkillsIndex();
    const entry = index.skills.find(s => s.name === name);
    if (!entry) return null;

    const filePath = join(getSkillsDir(), `${name}.md`);
    if (!existsSync(filePath)) return null;

    const content = readFileSync(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
        return {
            name,
            description: entry.description,
            tags: entry.tags,
            version: '1.0',
            content,
            filePath,
        };
    }

    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];

    // Simple YAML-like parsing
    const versionMatch = frontmatter.match(/version:\s*(.+)/);

    return {
        name,
        description: entry.description,
        tags: entry.tags,
        version: versionMatch ? versionMatch[1].trim() : '1.0',
        content: body.trim(),
        filePath,
    };
}

export function addSkill(
    name: string,
    content: string,
    description: string = '',
    tags: string[] = []
): Skill {
    ensureSkillsDir();

    const filePath = join(getSkillsDir(), `${name}.md`);
    const now = new Date().toISOString().split('T')[0];

    // Create markdown with frontmatter
    const fullContent = `---
name: ${name}
description: ${description}
tags: [${tags.join(', ')}]
version: 1.0
created: ${now}
---

${content}
`;

    writeFileSync(filePath, fullContent);

    // Update index
    const index = getSkillsIndex();
    const existingIndex = index.skills.findIndex(s => s.name === name);

    const entry = {
        name,
        description,
        tags,
        filePath,
    };

    if (existingIndex >= 0) {
        index.skills[existingIndex] = entry;
    } else {
        index.skills.push(entry);
    }

    saveSkillsIndex(index);

    return {
        name,
        description,
        tags,
        version: '1.0',
        content,
        filePath,
    };
}

export function deleteSkill(name: string): boolean {
    const index = getSkillsIndex();
    const entryIndex = index.skills.findIndex(s => s.name === name);
    if (entryIndex === -1) return false;

    const filePath = join(getSkillsDir(), `${name}.md`);
    if (existsSync(filePath)) {
        unlinkSync(filePath);
    }

    index.skills.splice(entryIndex, 1);
    saveSkillsIndex(index);

    return true;
}

export function formatSkillForPrompt(skill: Skill): string {
    return `[SKILL: ${skill.name}]
${skill.description ? `Description: ${skill.description}\n` : ''}
${skill.content}

[/SKILL]`;
}

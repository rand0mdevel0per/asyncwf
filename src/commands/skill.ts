import chalk from 'chalk';
import {
    listSkills,
    getSkill,
    addSkill,
    deleteSkill,
    formatSkillForPrompt
} from '../lib/skills.js';

interface SkillOptions {
    name?: string;
    content?: string;
    description?: string;
    tags?: string;
}

export async function skillCommand(
    action: string,
    options: SkillOptions
): Promise<void> {
    switch (action) {
        case 'list':
            handleList();
            break;
        case 'show':
            handleShow(options);
            break;
        case 'add':
            handleAdd(options);
            break;
        case 'delete':
            handleDelete(options);
            break;
        case 'use':
            handleUse(options);
            break;
        default:
            console.log(chalk.red(`Unknown action: ${action}`));
    }
}

function handleList(): void {
    const skills = listSkills();

    if (skills.length === 0) {
        console.log(chalk.gray('No skills available'));
        console.log(chalk.gray('\nAdd a skill with:'));
        console.log(chalk.gray('  asyncwf skill add <name> --content "..."'));
        return;
    }

    console.log(chalk.cyan(`📚 Available Skills (${skills.length}):\n`));

    for (const skill of skills) {
        console.log(chalk.green(`• ${skill.name}`));
        if (skill.description) {
            console.log(chalk.gray(`  ${skill.description}`));
        }
        if (skill.tags.length > 0) {
            console.log(chalk.gray(`  Tags: ${skill.tags.join(', ')}`));
        }
    }

    // Also output JSON for programmatic use
    console.log(chalk.gray('\n--- JSON ---'));
    console.log(JSON.stringify(skills, null, 2));
}

function handleShow(options: SkillOptions): void {
    const { name } = options;

    if (!name) {
        console.log(chalk.red('Error: skill name required'));
        return;
    }

    const skill = getSkill(name);
    if (!skill) {
        console.log(chalk.red(`Error: Skill "${name}" not found`));
        return;
    }

    console.log(chalk.cyan(`📖 Skill: ${skill.name}\n`));
    console.log(chalk.gray(`Description: ${skill.description || 'N/A'}`));
    console.log(chalk.gray(`Tags: ${skill.tags.join(', ') || 'N/A'}`));
    console.log(chalk.gray(`Version: ${skill.version}`));
    console.log(chalk.gray('---'));
    console.log(skill.content);
}

function handleAdd(options: SkillOptions): void {
    const { name, content, description, tags } = options;

    if (!name || !content) {
        console.log(chalk.red('Error: --name and --content are required'));
        return;
    }

    const tagList = tags ? tags.split(',').map(t => t.trim()) : [];

    const skill = addSkill(name, content, description || '', tagList);

    console.log(chalk.green(`✓ Skill "${name}" added`));
    console.log(chalk.gray(`  Path: ${skill.filePath}`));
}

function handleDelete(options: SkillOptions): void {
    const { name } = options;

    if (!name) {
        console.log(chalk.red('Error: skill name required'));
        return;
    }

    const success = deleteSkill(name);

    if (success) {
        console.log(chalk.green(`✓ Skill "${name}" deleted`));
    } else {
        console.log(chalk.red(`Error: Skill "${name}" not found`));
    }
}

function handleUse(options: SkillOptions): void {
    const { name } = options;

    if (!name) {
        console.log(chalk.red('Error: skill name required'));
        return;
    }

    const skill = getSkill(name);
    if (!skill) {
        console.log(chalk.red(`Error: Skill "${name}" not found`));
        return;
    }

    // Output formatted skill for prompt injection
    console.log(formatSkillForPrompt(skill));
}

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { generateClaudeMD } from '../lib/templates.js';
import { ensureSkillsDir } from '../lib/skills.js';
import { ensureKnowledgeDir } from '../lib/knowledge.js';

export async function initCommand(): Promise<void> {
    const cwd = process.cwd();

    console.log(chalk.cyan('🚀 Initializing AsyncWF...\n'));

    // 1. Ensure global ~/.ckb exists
    const ckbDir = join(homedir(), '.ckb');
    if (!existsSync(ckbDir)) {
        mkdirSync(ckbDir, { recursive: true });
        console.log(chalk.green('✓ Created global knowledge base: ~/.ckb'));
    } else {
        console.log(chalk.gray('• Global knowledge base exists: ~/.ckb'));
    }

    // Ensure subdirs
    const projectsDir = join(ckbDir, 'projects');
    if (!existsSync(projectsDir)) {
        mkdirSync(projectsDir, { recursive: true });
    }

    // Ensure skills and knowledge dirs
    ensureSkillsDir();
    console.log(chalk.green('✓ Skills directory ready: ~/.ckb/skills'));

    ensureKnowledgeDir();
    console.log(chalk.green('✓ Knowledge base ready: ~/.ckb/knowledge'));

    // 2. Create local .asyncwf directory
    const asyncwfDir = join(cwd, '.asyncwf');
    if (!existsSync(asyncwfDir)) {
        mkdirSync(asyncwfDir, { recursive: true });
        console.log(chalk.green('✓ Created .asyncwf/'));
    } else {
        console.log(chalk.gray('• .asyncwf/ exists'));
    }

    // Create config.json
    const configPath = join(asyncwfDir, 'config.json');
    if (!existsSync(configPath)) {
        writeFileSync(configPath, JSON.stringify({
            version: '1.0.0',
            agentCommand: 'claude',
            ckbPath: ckbDir,
        }, null, 2));
        console.log(chalk.green('✓ Created .asyncwf/config.json'));
    }

    // Create tasks.json
    const tasksPath = join(asyncwfDir, 'tasks.json');
    if (!existsSync(tasksPath)) {
        writeFileSync(tasksPath, JSON.stringify({ tasks: [] }, null, 2));
        console.log(chalk.green('✓ Created .asyncwf/tasks.json'));
    }

    // Create logs directory
    const logsDir = join(asyncwfDir, 'logs');
    if (!existsSync(logsDir)) {
        mkdirSync(logsDir, { recursive: true });
        console.log(chalk.green('✓ Created .asyncwf/logs/'));
    }

    // 3. Generate claude.md
    const claudeMdPath = join(cwd, 'claude.md');
    if (!existsSync(claudeMdPath)) {
        const content = generateClaudeMD();
        writeFileSync(claudeMdPath, content);
        console.log(chalk.green('✓ Generated claude.md with AsyncWF protocol'));
    } else {
        console.log(chalk.yellow('⚠ claude.md already exists (skipped)'));
    }

    // 4. Create specs directory if missing
    const specsDir = join(cwd, 'specs');
    if (!existsSync(specsDir)) {
        mkdirSync(specsDir, { recursive: true });
        console.log(chalk.green('✓ Created specs/'));
    }

    console.log(chalk.cyan('\n✨ AsyncWF initialized successfully!'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  1. Add your specs to specs/'));
    console.log(chalk.gray('  2. Run `asyncwf link` to connect to global KB'));
    console.log(chalk.gray('  3. Start using taskmgr for parallel workflows'));
}

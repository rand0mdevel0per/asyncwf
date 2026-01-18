import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { generateClaudeMD, generateGeminiMD, generateCodexMD } from '../lib/templates.js';
import { ensureSkillsDir } from '../lib/skills.js';
import { ensureKnowledgeDir } from '../lib/knowledge.js';
import type { AgentType } from '../types.js';

interface InitOptions {
    claude?: boolean;
    gemini?: boolean;
    codex?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
    const cwd = process.cwd();

    // Determine default agent from flags
    let defaultAgent: AgentType = 'claude';
    const agents: AgentType[] = [];

    if (options.claude) agents.push('claude');
    if (options.gemini) agents.push('gemini');
    if (options.codex) agents.push('codex');

    // If no flags, default to claude
    if (agents.length === 0) {
        agents.push('claude');
    }
    defaultAgent = agents[0];

    console.log(chalk.cyan('🚀 Initializing AsyncWF...\n'));
    console.log(chalk.gray(`   Default agent: ${defaultAgent}`));
    console.log(chalk.gray(`   Configured agents: ${agents.join(', ')}\n`));

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

    // Create config.json with agent configuration
    const configPath = join(asyncwfDir, 'config.json');
    writeFileSync(configPath, JSON.stringify({
        version: '1.0.0',
        defaultAgent: defaultAgent,
        configuredAgents: agents,
        ckbPath: ckbDir,
    }, null, 2));
    console.log(chalk.green('✓ Created .asyncwf/config.json'));

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

    // 3. Generate agent-specific config files
    // Always generate claude.md for claude (or as default)
    if (agents.includes('claude') || defaultAgent === 'claude') {
        const claudeMdPath = join(cwd, 'claude.md');
        if (!existsSync(claudeMdPath)) {
            const content = generateClaudeMD();
            writeFileSync(claudeMdPath, content);
            console.log(chalk.green('✓ Generated claude.md'));
        } else {
            console.log(chalk.yellow('⚠ claude.md already exists (skipped)'));
        }
    }

    // Generate GEMINI.md for gemini-cli
    if (agents.includes('gemini')) {
        const geminiMdPath = join(cwd, 'GEMINI.md');
        if (!existsSync(geminiMdPath)) {
            const content = generateGeminiMD();
            writeFileSync(geminiMdPath, content);
            console.log(chalk.green('✓ Generated GEMINI.md'));
        } else {
            console.log(chalk.yellow('⚠ GEMINI.md already exists (skipped)'));
        }
    }

    // Generate AGENTS.md for codex
    if (agents.includes('codex')) {
        const codexMdPath = join(cwd, 'AGENTS.md');
        if (!existsSync(codexMdPath)) {
            const content = generateCodexMD();
            writeFileSync(codexMdPath, content);
            console.log(chalk.green('✓ Generated AGENTS.md (for Codex)'));
        } else {
            console.log(chalk.yellow('⚠ AGENTS.md already exists (skipped)'));
        }
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
    console.log(chalk.gray('\nExample multi-agent dispatch:'));
    console.log(chalk.gray('  asyncwf taskmgr dispatch --job frontend --agent gemini --prompt "..."'));
    console.log(chalk.gray('  asyncwf taskmgr dispatch --job backend --agent claude --prompt "..."'));
    console.log(chalk.gray('  asyncwf taskmgr dispatch --job fullstack --agent codex --prompt "..."'));
}

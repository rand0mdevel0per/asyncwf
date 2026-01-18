import chalk from 'chalk';
import { execSync } from 'child_process';
import type { AgentType } from '../types.js';

interface AgentStatus {
    name: AgentType;
    command: string;
    available: boolean;
    version?: string;
}

function checkAgentAvailable(command: string): { available: boolean; version?: string } {
    try {
        const output = execSync(`${command} --version`, {
            timeout: 3000,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });
        const version = output.trim().split('\n')[0];
        return { available: true, version };
    } catch {
        return { available: false };
    }
}

export async function agentCommand(action: string): Promise<void> {
    switch (action) {
        case 'status':
            await handleStatus();
            break;
        default:
            console.log(chalk.red(`Unknown action: ${action}`));
            console.log(chalk.gray('Available: status'));
    }
}

async function handleStatus(): Promise<void> {
    console.log(chalk.cyan('🤖 Checking agent availability...\n'));

    const agents: Array<{ name: AgentType; command: string; description: string }> = [
        { name: 'claude', command: 'claude', description: 'Backend, system design, complex logic' },
        { name: 'codex', command: 'codex', description: 'Full-stack, rapid prototyping' },
        { name: 'gemini', command: 'gemini', description: 'Frontend, UI/UX, documentation' },
    ];

    const results: AgentStatus[] = [];

    for (const agent of agents) {
        const { available, version } = checkAgentAvailable(agent.command);
        results.push({
            name: agent.name,
            command: agent.command,
            available,
            version,
        });

        const statusIcon = available ? chalk.green('✓') : chalk.red('✗');
        const statusText = available ? chalk.green('available') : chalk.gray('not found');
        const versionText = version ? chalk.gray(` (${version})`) : '';

        console.log(`${statusIcon} ${chalk.bold(agent.name)}: ${statusText}${versionText}`);
        console.log(chalk.gray(`   ${agent.description}`));
        console.log();
    }

    // Summary
    const availableCount = results.filter(r => r.available).length;
    console.log(chalk.cyan('---'));
    console.log(`Available agents: ${availableCount}/${agents.length}`);

    if (availableCount === 0) {
        console.log(chalk.yellow('\n⚠ No agents found. Install at least one:'));
        console.log(chalk.gray('  • Claude: npm install -g @anthropic-ai/claude-code'));
        console.log(chalk.gray('  • Codex: npm install -g @openai/codex'));
        console.log(chalk.gray('  • Gemini: npm install -g @anthropic-ai/gemini-cli'));
    }

    // JSON output for programmatic use
    console.log(chalk.gray('\n--- JSON ---'));
    console.log(JSON.stringify(results, null, 2));
}

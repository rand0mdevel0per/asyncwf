import { readFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import {
    getAllTasks,
    getTasksByStatus,
    getTask,
    getLogPath
} from '../lib/state.js';
import { dispatchAgent, killAgent, waitForJobs } from '../lib/agent.js';
import type { TaskStatus, AgentType } from '../types.js';

interface TaskmgrOptions {
    job?: string;
    prompt?: string;
    skill?: string;
    agent?: string;
    status?: string;
    jobs?: string;
    timeout?: string;
}

export async function taskmgrCommand(
    action: string,
    options: TaskmgrOptions
): Promise<void> {
    switch (action) {
        case 'dispatch':
            await handleDispatch(options);
            break;
        case 'list':
            await handleList(options);
            break;
        case 'wait':
            await handleWait(options);
            break;
        case 'fetch':
            await handleFetch(options);
            break;
        case 'kill':
            await handleKill(options);
            break;
        default:
            console.log(chalk.red(`Unknown action: ${action}`));
    }
}

async function handleDispatch(options: TaskmgrOptions): Promise<void> {
    const { job, prompt, skill, agent } = options;

    if (!job || !prompt) {
        console.log(chalk.red('Error: --job and --prompt are required'));
        return;
    }

    // Validate agent type if provided
    const validAgents: AgentType[] = ['claude', 'codex', 'gemini'];
    let agentType: AgentType | undefined;
    if (agent) {
        if (!validAgents.includes(agent as AgentType)) {
            console.log(chalk.red(`Error: Invalid agent "${agent}". Valid options: ${validAgents.join(', ')}`));
            return;
        }
        agentType = agent as AgentType;
    }

    // Check if job already exists
    const existing = await getTask(job);
    if (existing) {
        console.log(chalk.red(`Error: Job "${job}" already exists`));
        return;
    }

    console.log(chalk.cyan(`🚀 Dispatching job: ${job}`));
    if (agentType) {
        console.log(chalk.gray(`  Agent: ${agentType}`));
    }
    if (skill) {
        console.log(chalk.gray(`  Skill: ${skill}`));
    }

    const task = await dispatchAgent(job, prompt, skill, agentType);

    console.log(chalk.green(`✓ Job dispatched`));
    console.log(JSON.stringify({
        id: task.id,
        agent: task.agent,
        status: task.status,
        pid: task.pid,
        skill: task.skill,
    }, null, 2));
}

async function handleList(options: TaskmgrOptions): Promise<void> {
    const { status } = options;

    let tasks;
    if (status) {
        tasks = await getTasksByStatus(status as TaskStatus);
    } else {
        tasks = await getAllTasks();
    }

    if (tasks.length === 0) {
        console.log(chalk.gray('No tasks found'));
        return;
    }

    // Output as JSON for easy parsing by Claude
    console.log(JSON.stringify(tasks.map(t => ({
        id: t.id,
        status: t.status,
        skill: t.skill,
        pid: t.pid,
        exitCode: t.exitCode,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    })), null, 2));
}

async function handleWait(options: TaskmgrOptions): Promise<void> {
    const { jobs, timeout } = options;

    if (!jobs) {
        console.log(chalk.red('Error: --jobs is required'));
        return;
    }

    const jobIds = jobs.split(',').map(s => s.trim());
    const timeoutMs = parseInt(timeout || '300000', 10);

    console.log(chalk.cyan(`⏳ Waiting for jobs: ${jobIds.join(', ')}`));
    console.log(chalk.gray(`  Timeout: ${timeoutMs / 1000}s`));

    const results = await waitForJobs(jobIds, timeoutMs);

    console.log(chalk.green(`\n✓ Jobs completed`));
    console.log(JSON.stringify(results.map(t => ({
        id: t.id,
        status: t.status,
        exitCode: t.exitCode,
    })), null, 2));
}

async function handleFetch(options: TaskmgrOptions): Promise<void> {
    const { job } = options;

    if (!job) {
        console.log(chalk.red('Error: --job is required'));
        return;
    }

    const task = await getTask(job);
    if (!task) {
        console.log(chalk.red(`Error: Job "${job}" not found`));
        return;
    }

    const logPath = getLogPath(job);
    if (!existsSync(logPath)) {
        console.log(chalk.yellow(`No output file found for job "${job}"`));
        return;
    }

    const content = readFileSync(logPath, 'utf-8');

    console.log(chalk.cyan(`📄 Output for job: ${job}`));
    console.log(chalk.gray(`Status: ${task.status}`));
    console.log(chalk.gray('---'));
    console.log(content);
}

async function handleKill(options: TaskmgrOptions): Promise<void> {
    const { job } = options;

    if (!job) {
        console.log(chalk.red('Error: --job is required'));
        return;
    }

    const success = await killAgent(job);

    if (success) {
        console.log(chalk.green(`✓ Job "${job}" terminated`));
    } else {
        console.log(chalk.yellow(`⚠ Could not terminate job "${job}" (may have already finished)`));
    }
}

import { spawn, ChildProcess } from 'child_process';
import { createWriteStream, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getLogPath, getLogsDir, createTask, updateTask, getTask } from './state.js';
import { getSkill, formatSkillForPrompt } from './skills.js';
import type { Task, AgentType } from '../types.js';

// Store child process references for kill
const processes: Map<string, ChildProcess> = new Map();

// Agent command configurations
export const AGENT_CONFIGS: Record<AgentType, { command: string; promptArg: string[] }> = {
    claude: { command: 'claude', promptArg: ['-p'] },
    codex: { command: 'codex', promptArg: ['-q'] },  // codex uses -q for quiet mode with prompt
    gemini: { command: 'gemini', promptArg: ['-p'] }, // gemini-cli
};

// Get default agent from config
export function getDefaultAgent(): AgentType {
    const configPath = join(process.cwd(), '.asyncwf', 'config.json');
    if (existsSync(configPath)) {
        try {
            const config = JSON.parse(readFileSync(configPath, 'utf-8'));
            return config.defaultAgent || 'claude';
        } catch {
            return 'claude';
        }
    }
    return 'claude';
}

export async function dispatchAgent(
    jobId: string,
    prompt: string,
    skillName?: string,
    agentType?: AgentType
): Promise<Task> {
    // Build full prompt with skill if provided
    let fullPrompt = prompt;
    if (skillName) {
        const skill = getSkill(skillName);
        if (skill) {
            fullPrompt = `${formatSkillForPrompt(skill)}\n\n${prompt}`;
        }
    }

    // Create log file
    const logsDir = getLogsDir();
    if (!existsSync(logsDir)) {
        const { mkdirSync } = await import('fs');
        mkdirSync(logsDir, { recursive: true });
    }

    const logPath = getLogPath(jobId);
    const logStream = createWriteStream(logPath);

    // Determine which agent to use
    const agent: AgentType = agentType || getDefaultAgent();
    const agentConfig = AGENT_CONFIGS[agent];

    // Create task record
    const task = await createTask({
        id: jobId,
        prompt: fullPrompt,
        skill: skillName,
        agent: agent,
        status: 'running',
        logFile: logPath,
    });

    // Build command args
    const args = [...agentConfig.promptArg, fullPrompt];

    try {
        const child = spawn(agentConfig.command, args, {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
        });

        processes.set(jobId, child);

        // Pipe output to log file
        child.stdout?.pipe(logStream);
        child.stderr?.pipe(logStream);

        // Update task with PID
        await updateTask(jobId, { pid: child.pid });

        // Handle process exit
        child.on('exit', async (code) => {
            processes.delete(jobId);
            logStream.end();
            await updateTask(jobId, {
                status: code === 0 ? 'done' : 'failed',
                exitCode: code ?? -1,
            });
        });

        child.on('error', async (err) => {
            processes.delete(jobId);
            logStream.write(`\nError: ${err.message}\n`);
            logStream.end();
            await updateTask(jobId, {
                status: 'failed',
                exitCode: -1,
            });
        });

        // Unref to allow parent to exit
        child.unref();

    } catch (error) {
        logStream.write(`Failed to spawn agent: ${error}\n`);
        logStream.end();
        await updateTask(jobId, {
            status: 'failed',
            exitCode: -1,
        });
    }

    return task;
}

export async function killAgent(jobId: string): Promise<boolean> {
    const task = await getTask(jobId);
    if (!task) return false;

    // Try to kill by stored process reference
    const proc = processes.get(jobId);
    if (proc && !proc.killed) {
        proc.kill('SIGTERM');
        processes.delete(jobId);
        await updateTask(jobId, { status: 'failed', exitCode: -1 });
        return true;
    }

    // Try to kill by PID
    if (task.pid) {
        try {
            process.kill(task.pid, 'SIGTERM');
            await updateTask(jobId, { status: 'failed', exitCode: -1 });
            return true;
        } catch {
            // Process may have already exited
        }
    }

    return false;
}

export async function waitForJobs(
    jobIds: string[],
    timeoutMs: number = 300000
): Promise<Task[]> {
    const startTime = Date.now();
    const pollInterval = 1000; // 1 second

    while (Date.now() - startTime < timeoutMs) {
        const tasks = await Promise.all(jobIds.map(id => getTask(id)));
        const validTasks = tasks.filter((t): t is Task => t !== undefined);

        // Check if all tasks are complete
        const allComplete = validTasks.every(
            t => t.status === 'done' || t.status === 'failed'
        );

        if (allComplete) {
            return validTasks;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout - return current state
    const tasks = await Promise.all(jobIds.map(id => getTask(id)));
    return tasks.filter((t): t is Task => t !== undefined);
}

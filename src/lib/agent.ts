import { spawn, ChildProcess } from 'child_process';
import { createWriteStream, existsSync } from 'fs';
import { join } from 'path';
import { getLogPath, getLogsDir, createTask, updateTask, getTask } from './state.js';
import { getSkill, formatSkillForPrompt } from './skills.js';
import type { Task } from '../types.js';

// Store child process references for kill
const processes: Map<string, ChildProcess> = new Map();

export async function dispatchAgent(
    jobId: string,
    prompt: string,
    skillName?: string
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

    // Create task record
    const task = await createTask({
        id: jobId,
        prompt: fullPrompt,
        skill: skillName,
        status: 'running',
        logFile: logPath,
    });

    // Spawn the agent process
    // Try claude CLI first, fallback to echo for testing
    const agentCommand = process.env.ASYNCWF_AGENT || 'claude';
    const args = agentCommand === 'claude'
        ? ['-p', fullPrompt]
        : [fullPrompt]; // For testing with echo

    try {
        const child = spawn(agentCommand, args, {
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

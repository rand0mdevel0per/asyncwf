import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Task, TasksState, TaskStatus } from '../types.js';

const ASYNCWF_DIR = '.asyncwf';
const TASKS_FILE = 'tasks.json';

let db: Low<TasksState> | null = null;

function getAsyncWFDir(): string {
    return join(process.cwd(), ASYNCWF_DIR);
}

function getTasksPath(): string {
    return join(getAsyncWFDir(), TASKS_FILE);
}

export async function initTasksDB(): Promise<Low<TasksState>> {
    const dir = getAsyncWFDir();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const logsDir = join(dir, 'logs');
    if (!existsSync(logsDir)) {
        mkdirSync(logsDir, { recursive: true });
    }

    const adapter = new JSONFile<TasksState>(getTasksPath());
    db = new Low(adapter, { tasks: [] });
    await db.read();
    return db;
}

export async function getDB(): Promise<Low<TasksState>> {
    if (!db) {
        return await initTasksDB();
    }
    await db.read();
    return db;
}

export async function getTask(id: string): Promise<Task | undefined> {
    const db = await getDB();
    return db.data.tasks.find(t => t.id === id);
}

export async function getAllTasks(): Promise<Task[]> {
    const db = await getDB();
    return db.data.tasks;
}

export async function getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const db = await getDB();
    return db.data.tasks.filter(t => t.status === status);
}

export async function createTask(task: Omit<Task, 'createdAt' | 'updatedAt'>): Promise<Task> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newTask: Task = {
        ...task,
        createdAt: now,
        updatedAt: now,
    };
    db.data.tasks.push(newTask);
    await db.write();
    return newTask;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const db = await getDB();
    const index = db.data.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    db.data.tasks[index] = {
        ...db.data.tasks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    await db.write();
    return db.data.tasks[index];
}

export async function deleteTask(id: string): Promise<boolean> {
    const db = await getDB();
    const index = db.data.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    db.data.tasks.splice(index, 1);
    await db.write();
    return true;
}

export function getLogsDir(): string {
    return join(getAsyncWFDir(), 'logs');
}

export function getLogPath(jobId: string): string {
    return join(getLogsDir(), `${jobId}.log`);
}

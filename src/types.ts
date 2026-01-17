// Task status enum
export type TaskStatus = 'pending' | 'running' | 'done' | 'failed';

// Task definition
export interface Task {
    id: string;
    prompt: string;
    skill?: string;
    status: TaskStatus;
    pid?: number;
    exitCode?: number;
    createdAt: string;
    updatedAt: string;
    logFile?: string;
}

// Tasks state
export interface TasksState {
    tasks: Task[];
}

// Skill definition
export interface Skill {
    name: string;
    description: string;
    tags: string[];
    version: string;
    content: string;
    filePath: string;
}

// Skills index
export interface SkillsIndex {
    skills: Array<{
        name: string;
        description: string;
        tags: string[];
        filePath: string;
    }>;
}

// Knowledge entry
export interface KnowledgeEntry {
    topic: string;
    created: string;
    updated: string;
    source: 'model-learned' | 'user-provided' | 'imported';
    content: string;
    filePath: string;
}

// Knowledge index
export interface KnowledgeIndex {
    entries: Array<{
        topic: string;
        created: string;
        updated: string;
        filePath: string;
    }>;
}

// Config
export interface AsyncWFConfig {
    version: string;
    agentCommand: string;
    ckbPath: string;
}

// Global config
export interface GlobalConfig {
    version: string;
    defaultAgentCommand: string;
}

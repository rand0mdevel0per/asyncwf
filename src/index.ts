#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { linkCommand } from './commands/link.js';
import { taskmgrCommand } from './commands/taskmgr.js';
import { skillCommand } from './commands/skill.js';
import { kbCommand } from './commands/kb.js';

const program = new Command();

program
    .name('asyncwf')
    .description(chalk.cyan('AsyncWF - Model-Driven Parallel Agent Workflow CLI'))
    .version('1.1.0');

// Setup commands
program
    .command('init')
    .description('Initialize AsyncWF in the current directory')
    .option('-c, --claude', 'Configure for Claude Code (default)')
    .option('-g, --gemini', 'Configure for Gemini CLI')
    .option('-x, --codex', 'Configure for OpenAI Codex')
    .action((opts) => initCommand(opts));

program
    .command('link')
    .description('Link local specs to global knowledge base')
    .action(linkCommand);

// Task Manager
const taskmgr = program
    .command('taskmgr')
    .description('Task manager for parallel agent workflows');

taskmgr
    .command('dispatch')
    .description('Spawn a sub-agent task')
    .requiredOption('--job <id>', 'Job identifier')
    .requiredOption('--prompt <text>', 'Prompt for the sub-agent')
    .option('--skill <name>', 'Skill to inject into prompt')
    .option('--agent <type>', 'Agent type: claude, codex, or gemini')
    .action((opts) => taskmgrCommand('dispatch', opts));

taskmgr
    .command('list')
    .description('List all tasks')
    .option('--status <status>', 'Filter by status (pending|running|done|failed)')
    .action((opts) => taskmgrCommand('list', opts));

taskmgr
    .command('wait')
    .description('Wait for tasks to complete')
    .requiredOption('--jobs <ids>', 'Comma-separated job IDs')
    .option('--timeout <ms>', 'Timeout in milliseconds', '300000')
    .action((opts) => taskmgrCommand('wait', opts));

taskmgr
    .command('fetch')
    .description('Fetch task output')
    .requiredOption('--job <id>', 'Job identifier')
    .action((opts) => taskmgrCommand('fetch', opts));

taskmgr
    .command('kill')
    .description('Kill a running task')
    .requiredOption('--job <id>', 'Job identifier')
    .action((opts) => taskmgrCommand('kill', opts));

// Skills Manager
const skill = program
    .command('skill')
    .description('Manage reusable skills');

skill
    .command('list')
    .description('List all available skills')
    .action(() => skillCommand('list', {}));

skill
    .command('show <name>')
    .description('Display skill content')
    .action((name) => skillCommand('show', { name }));

skill
    .command('add <name>')
    .description('Add or update a skill')
    .requiredOption('--content <markdown>', 'Skill content in markdown')
    .option('--description <text>', 'Skill description')
    .option('--tags <tags>', 'Comma-separated tags')
    .action((name, opts) => skillCommand('add', { name, ...opts }));

skill
    .command('delete <name>')
    .description('Delete a skill')
    .action((name) => skillCommand('delete', { name }));

skill
    .command('use <name>')
    .description('Output skill content for prompt injection')
    .action((name) => skillCommand('use', { name }));

// Knowledge Base
const kb = program
    .command('kb')
    .description('Manage knowledge base');

kb
    .command('list')
    .description('List all knowledge entries')
    .action(() => kbCommand('list', {}));

kb
    .command('show <topic>')
    .description('Display knowledge entry')
    .action((topic) => kbCommand('show', { topic }));

kb
    .command('learn')
    .description('Add learned knowledge')
    .requiredOption('--topic <name>', 'Knowledge topic')
    .requiredOption('--content <markdown>', 'Knowledge content')
    .action((opts) => kbCommand('learn', opts));

kb
    .command('search <query>')
    .description('Search knowledge base')
    .action((query) => kbCommand('search', { query }));

kb
    .command('delete <topic>')
    .description('Delete knowledge entry')
    .action((topic) => kbCommand('delete', { topic }));

program.parse();

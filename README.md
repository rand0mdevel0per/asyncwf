# AsyncWF

**Model-Driven Parallel Agent Workflow CLI for claude-code**

AsyncWF empowers claude-code with asynchronous multitasking capabilities through a lightweight, tool-centric CLI. Instead of wrapping the LLM in a rigid control loop, AsyncWF injects a "Parallel Workflow Protocol" directly into the model's context.

## Features

- 🚀 **Parallel Task Dispatch** - Spawn multiple sub-agents concurrently
- 📚 **Skills System** - Global reusable action templates
- 🧠 **Knowledge Base** - Model-driven learning and context persistence
- 🔗 **Project Linking** - Connect specs to global knowledge base

## Installation

```bash
npm install -g asyncwf
```

Or from source:

```bash
git clone https://github.com/yourname/asyncwf
cd asyncwf
npm install
npm run build
npm link
```

## Quick Start

```bash
# Initialize a project
asyncwf init

# Link specs to global KB
asyncwf link

# Dispatch parallel tasks
asyncwf taskmgr dispatch --job api --prompt "Write a REST API handler"
asyncwf taskmgr dispatch --job tests --prompt "Write unit tests"

# Wait for completion
asyncwf taskmgr wait --jobs api,tests

# Fetch results
asyncwf taskmgr fetch --job api
```

## Commands

### Setup

| Command | Description |
|---------|-------------|
| `asyncwf init` | Initialize project with `.asyncwf/` and `claude.md` |
| `asyncwf link` | Link specs to `~/.ckb/projects/` |

### Task Manager

| Command | Description |
|---------|-------------|
| `asyncwf taskmgr dispatch --job <id> --prompt "<text>" [--skill <name>]` | Spawn sub-agent |
| `asyncwf taskmgr list [--status <status>]` | List tasks |
| `asyncwf taskmgr wait --jobs <ids>` | Wait for completion |
| `asyncwf taskmgr fetch --job <id>` | Get task output |
| `asyncwf taskmgr kill --job <id>` | Terminate task |

### Skills

| Command | Description |
|---------|-------------|
| `asyncwf skill list` | List available skills |
| `asyncwf skill show <name>` | Display skill content |
| `asyncwf skill add <name> --content "<md>"` | Add/update skill |
| `asyncwf skill use <name>` | Output for prompt injection |
| `asyncwf skill delete <name>` | Remove skill |

### Knowledge Base

| Command | Description |
|---------|-------------|
| `asyncwf kb list` | List knowledge entries |
| `asyncwf kb show <topic>` | Display entry |
| `asyncwf kb learn --topic <name> --content "<md>"` | Learn new knowledge |
| `asyncwf kb search <query>` | Search KB |
| `asyncwf kb delete <topic>` | Remove entry |

## Directory Structure

```
~/.ckb/                    # Global Knowledge Base
├── skills/                # Reusable skills
├── knowledge/             # Learned knowledge
└── projects/              # Project symlinks

.asyncwf/                  # Local project state
├── config.json
├── tasks.json
└── logs/
```

## How It Works

1. **Controller**: Main claude-code session running in terminal
2. **Protocol**: Instructions injected into `claude.md`
3. **Workers**: Ephemeral sub-agents spawned via `taskmgr dispatch`
4. **State**: Local JSON registry tracking job status

## License

MIT

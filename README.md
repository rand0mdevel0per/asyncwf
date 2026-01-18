# AsyncWF

**Model-Driven Parallel Agent Workflow CLI**

AsyncWF empowers AI coding assistants (Claude Code, Codex, Gemini) with asynchronous multitasking capabilities. Instead of wrapping the LLM in a rigid control loop, AsyncWF injects a "Parallel Workflow Protocol" directly into the model's context.

## Features

- 🤖 **Multi-Agent Support** - Claude, Codex, Gemini working together
- 🚀 **Parallel Task Dispatch** - Spawn multiple sub-agents concurrently
- 📚 **Skills System** - Global reusable action templates
- 🧠 **Knowledge Base** - Model-driven learning and context persistence

## Installation

```bash
npm install -g asyncwf
```

## Quick Start

```bash
# Initialize for Claude (default)
asyncwf init

# Initialize for multiple agents
asyncwf init -c -g -x   # Claude + Gemini + Codex

# Multi-agent parallel workflow
asyncwf taskmgr dispatch --job frontend --agent gemini --prompt "Create React UI..."
asyncwf taskmgr dispatch --job backend --agent claude --prompt "Build REST API..."
asyncwf taskmgr dispatch --job fullstack --agent codex --prompt "Integrate..."

# Wait and fetch
asyncwf taskmgr wait --jobs frontend,backend,fullstack
asyncwf taskmgr fetch --job frontend
```

## Commands

### Init Options

| Flag | Description |
|------|-------------|
| `-c, --claude` | Configure for Claude Code (default) |
| `-g, --gemini` | Configure for Gemini CLI |
| `-x, --codex` | Configure for OpenAI Codex |

### Task Manager

| Command | Description |
|---------|-------------|
| `dispatch --job <id> --agent <type> --prompt "<text>"` | Spawn sub-agent |
| `list [--status <status>]` | List tasks |
| `wait --jobs <ids>` | Wait for completion |
| `fetch --job <id>` | Get output |
| `kill --job <id>` | Terminate |

**Agent types:** `claude`, `codex`, `gemini`

### Skills & Knowledge Base

```bash
asyncwf skill list                      # List skills
asyncwf skill add <name> --content "..."  # Add skill
asyncwf kb learn --topic <n> --content "..."  # Learn
asyncwf kb search <query>               # Search
```

## Multi-Agent Workflow Example

```
User: "Build a login system with React frontend and Rust backend"

Claude (Controller):
1. asyncwf taskmgr dispatch --job ui --agent gemini --prompt "React login form..."
2. asyncwf taskmgr dispatch --job api --agent claude --prompt "Rust Actix handler..."
3. asyncwf taskmgr wait --jobs ui,api
4. asyncwf taskmgr fetch --job ui
5. asyncwf taskmgr fetch --job api
```

## Directory Structure

```
~/.ckb/              # Global KB (skills, knowledge, projects)
.asyncwf/            # Local state (config, tasks, logs)
claude.md            # Claude protocol
GEMINI.md            # Gemini protocol (if -g)
AGENTS.md            # Codex protocol (if -x)
```

## License

MIT

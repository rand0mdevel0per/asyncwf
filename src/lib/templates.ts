export const ARCHITECT_PERSONA = `## Architect Persona

You are operating as a senior software architect with the ability to parallelize work.
You have access to the \`asyncwf\` tool suite for managing parallel agent workflows.

**Capabilities:**
- Analyze complex tasks and decompose into independent sub-tasks
- Dispatch parallel sub-agents for concurrent execution
- Coordinate and integrate outputs from multiple agents
- Learn and reuse skills across projects
`;

export const AGENT_SELECTION_GUIDE = `## Agent Selection Guide

### Check Available Agents
Before dispatching, check which agents are available:
\`\`\`bash
asyncwf agent status
\`\`\`

### Agent Comparison

| Agent | Strengths | Weaknesses | Best For |
|-------|-----------|------------|----------|
| **Claude Code** | Deep reasoning, complex logic, system design, debugging | Slower on simple tasks | Backend, architecture, Rust/Go/Python, debugging |
| **Codex (cx)** | Fast iteration, full-stack, good context | Less deep analysis | Rapid prototyping, JS/TS, full-stack features |
| **Gemini** | Multimodal, long context, documentation | Less coding-focused | Frontend, UI/UX, docs, code review, large files |

### Decision Framework

1. **Backend / System Design / Complex Logic**
   → Use \`--agent claude\`
   - Complex algorithms, multi-file refactoring, architecture decisions
   
2. **Frontend / UI / Documentation**
   → Use \`--agent gemini\`
   - React/Vue components, CSS, markdown docs, multimodal tasks
   
3. **Full-Stack / Quick Features / Integration**
   → Use \`--agent codex\`
   - End-to-end features, API + UI together, rapid prototyping

4. **Fallback Strategy**
   - If preferred agent unavailable, use the next best match
   - Claude → Codex → Gemini (for backend)
   - Gemini → Codex → Claude (for frontend)

### Example: Intelligent Dispatch
\`\`\`bash
# Check availability first
asyncwf agent status

# Then dispatch based on task type
asyncwf taskmgr dispatch --job auth-api --agent claude --prompt "Implement JWT auth..."
asyncwf taskmgr dispatch --job login-ui --agent gemini --prompt "Create login form..."
asyncwf taskmgr dispatch --job connect --agent codex --prompt "Wire API to UI..."
\`\`\`
`;

export const MULTI_AGENT_PROTOCOL = `## Multi-Agent Collaboration

You can dispatch tasks to different AI agents based on their strengths:

| Agent | Flag | Best For |
|-------|------|----------|
| Claude Code | \`--agent claude\` | Backend, system design, complex logic |
| Codex | \`--agent codex\` | Full-stack, rapid prototyping |
| Gemini | \`--agent gemini\` | Frontend, UI/UX, documentation |

**Example - Parallel Multi-Agent Workflow:**
\`\`\`bash
# Frontend with Gemini
asyncwf taskmgr dispatch --job frontend --agent gemini --prompt "Create React components for..."

# Backend with Claude
asyncwf taskmgr dispatch --job backend --agent claude --prompt "Implement REST API for..."

# Full-stack integration with Codex
asyncwf taskmgr dispatch --job integration --agent codex --prompt "Connect frontend and backend..."

# Wait for all
asyncwf taskmgr wait --jobs frontend,backend,integration
\`\`\`
`;

export const PARALLEL_PROTOCOL = `## Parallel Execution Protocol

[SYSTEM: ASYNCWF ENABLED]

### When to Parallelize
If a request involves multiple distinct, independent modules (e.g., "Write the Rust Client AND the Python Backend"), DO NOT do them sequentially.

### How to Use

1. **Analyze**: Break the request into independent sub-tasks.
2. **Check Agents**: Run \`asyncwf agent status\` to see available backends.
3. **Check Skills**: Run \`asyncwf skill list\` to see available reusable patterns.
4. **Dispatch**: Run multiple dispatch commands:
   \`\`\`bash
   asyncwf taskmgr dispatch --job <id> --agent <type> --prompt "<context>" [--skill <name>]
   \`\`\`
   Agents: \`claude\` | \`codex\` | \`gemini\`
5. **Wait**: Run \`asyncwf taskmgr wait --jobs <id1>,<id2>,...\`
6. **Fetch & Integrate**: Run \`asyncwf taskmgr fetch --job <id>\` to see outputs.
7. **Review**: Check for consistency between outputs.

### Skills Usage
- List skills: \`asyncwf skill list\`
- Use skill in dispatch: \`asyncwf taskmgr dispatch --job api --skill rust-api --prompt "..."\`
- Add new skill: \`asyncwf skill add <name> --content "<markdown>"\`

### Knowledge Base
- Search knowledge: \`asyncwf kb search <query>\`
- Learn new knowledge: \`asyncwf kb learn --topic <name> --content "<insights>"\`
- Review knowledge: \`asyncwf kb show <topic>\`

### Constraints
- Sub-agents cannot see your conversation history - provide FULL context in --prompt
- Use skills to ensure consistent patterns across agents
- Learn reusable patterns to knowledge base for future reference
- Always check \`asyncwf link\` status before starting to ensure specs are up to date
`;

export const FILE_WATCH_DIRECTIVE = `## File Watching

Monitor the \`specs/\` directory for specification changes.
When specs are updated, run \`asyncwf link\` to refresh project context.
`;

export function generateClaudeMD(projectContext: string = ''): string {
    let content = `# AsyncWF Project Configuration

${ARCHITECT_PERSONA}

${AGENT_SELECTION_GUIDE}

${MULTI_AGENT_PROTOCOL}

${PARALLEL_PROTOCOL}

${FILE_WATCH_DIRECTIVE}
`;

    if (projectContext) {
        content += `
## Project Context

${projectContext}
`;
    }

    return content;
}

export function generateGeminiMD(projectContext: string = ''): string {
    let content = `# AsyncWF - Gemini Agent Configuration

${ARCHITECT_PERSONA}

## Your Role
You are the **Frontend & UI Specialist** in a multi-agent team.
Focus on: React, Vue, CSS, UI/UX design, documentation.

${AGENT_SELECTION_GUIDE}

${MULTI_AGENT_PROTOCOL}

${PARALLEL_PROTOCOL}

${FILE_WATCH_DIRECTIVE}
`;

    if (projectContext) {
        content += `
## Project Context

${projectContext}
`;
    }

    return content;
}

export function generateCodexMD(projectContext: string = ''): string {
    let content = `# AsyncWF - Codex Agent Configuration

${ARCHITECT_PERSONA}

## Your Role
You are the **Full-Stack Integrator** in a multi-agent team.
Focus on: connecting components, rapid prototyping, end-to-end features.

${AGENT_SELECTION_GUIDE}

${MULTI_AGENT_PROTOCOL}

${PARALLEL_PROTOCOL}

${FILE_WATCH_DIRECTIVE}
`;

    if (projectContext) {
        content += `
## Project Context

${projectContext}
`;
    }

    return content;
}

export function generateProjectContext(specs: Array<{ name: string; summary: string }>): string {
    if (specs.length === 0) return '';

    let context = 'The following specifications are available:\n\n';
    for (const spec of specs) {
        context += `- **${spec.name}**: ${spec.summary}\n`;
    }
    return context;
}

export const ARCHITECT_PERSONA = `## Architect Persona

You are operating as a senior software architect with the ability to parallelize work.
You have access to the \`asyncwf\` tool suite for managing parallel agent workflows.

**Capabilities:**
- Analyze complex tasks and decompose into independent sub-tasks
- Dispatch parallel sub-agents for concurrent execution
- Coordinate and integrate outputs from multiple agents
- Learn and reuse skills across projects
`;

export const PARALLEL_PROTOCOL = `## Parallel Execution Protocol

[SYSTEM: ASYNCWF ENABLED]

### When to Parallelize
If a request involves multiple distinct, independent modules (e.g., "Write the Rust Client AND the Python Backend"), DO NOT do them sequentially.

### How to Use

1. **Analyze**: Break the request into independent sub-tasks.
2. **Check Skills**: Run \`asyncwf skill list\` to see available reusable patterns.
3. **Dispatch**: Run multiple dispatch commands:
   \`\`\`bash
   asyncwf taskmgr dispatch --job <id> --prompt "<context>" [--skill <name>]
   \`\`\`
4. **Wait**: Run \`asyncwf taskmgr wait --jobs <id1>,<id2>,...\`
5. **Fetch & Integrate**: Run \`asyncwf taskmgr fetch --job <id>\` to see outputs.
6. **Review**: Check for consistency between outputs.

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

# **AsyncWF: Model-Driven Parallel Agent Workflow**

## **Technical Specification v2.0**

### **1\. Overview**

**AsyncWF** is a lightweight, tool-centric CLI designed to empower claude-code with asynchronous multitasking capabilities. Unlike traditional agent frameworks that wrap the LLM in a rigid control loop, AsyncWF injects a **"Parallel Workflow Protocol"** directly into the model's context via claude.md.

**Core Philosophy:**

* **Model Autonomy:** The LLM decides *when* and *how* to use parallel agents based on instructions in claude.md.  
* **Tool-Use First:** The CLI provides the plumbing (taskmgr); the model provides the intelligence.  
* **Context Preservation:** Leveraging \~/.ckb (Cyber Knowledge Base) to maintain persistent context across disjointed agent processes.

### **2\. Architecture**

#### **2.1 The "Inversion of Control" Model**

Instead of asyncwf driving Claude, **Claude drives asyncwf**.

1. **The Controller:** The primary claude-code session running in the terminal.  
2. **The Protocol:** A set of instructions injected into claude.md (created by asyncwf init).  
3. **The Workers:** Ephemeral claude-code (or raw API) processes spawned via asyncwf taskmgr.  
4. **The State:** A local JSON registry in .asyncwf/tasks.json tracking job status.

#### **2.2 Directory Structure**

Project Root/  
├── claude.md            \# The "Brain". Contains Project Context \+ AsyncWF Protocol.  
├── specs/               \# Local specs.  
└── .asyncwf/            \# Local state (git-ignored).  
    ├── config.json  
    ├── tasks.json       \# TaskMgr state.  
    └── logs/            \# Stdout/Stderr from sub-agents.

\~/.ckb/                  \# Global Knowledge Base (Symlinks).

### **3\. Command Interface**

#### **3.1 Setup Commands**

**Command:** asyncwf init

* **Objective:** Bootstrap the current directory for AI-augmented development.  
* **Actions:**  
  1. Checks if global \~/.ckb exists (creates if missing).  
  2. Creates local .asyncwf/ directory.  
  3. **Generates claude.md**:  
     * Injects the **"Architect Persona"**.  
     * Injects the **"Parallel Execution Protocol"** (Instructions on how/when to use taskmgr).  
     * Injects a file-watching directive to monitor specs/.

**Command:** asyncwf link

* **Objective:** Connect local knowledge to the global brain.  
* **Actions:**  
  1. Scans ./specs/\*.md.  
  2. Symlinks the current directory to \~/.ckb/projects/\<project\_name\>.  
  3. **Updates claude.md**: Appends a "Project Context" section with summaries of the linked specs.

#### **3.2 The Task Manager (The Tool)**

This is the command claude-code will invoke directly in the terminal.

**Command:** asyncwf taskmgr \<action\> \[options\]

| Action | Options | Description |
| :---- | :---- | :---- |
| dispatch | \--job \<id\> \--prompt "\<text\>" | Spawns a detached process. This process runs a sub-agent (e.g., claude \-p "\<text\>") to handle the specific task. Returns PID. |
| list | \--status \[running|done|failed\] | Returns a JSON list of active jobs and their status. |
| wait | \--jobs \<id1\>,\<id2\>... | Blocks execution until specified jobs are finished. Used by the main agent to sync. |
| fetch | \--job \<id\> | Reads the result (file output or stdout) of the completed job. |
| kill | \--job \<id\> | Terminates a rogue agent. |

### **4\. The "Parallel Execution Protocol" (Injected into claude.md)**

The asyncwf init command writes the following logic into the system prompt:

\[SYSTEM: PARALLEL WORKFLOW ENABLED\]  
You have access to the asyncwf tool suite.  
WHEN TO USE:  
If a user request involves multiple distinct modules (e.g., "Write the Rust Client AND the Modal Python Backend"), DO NOT do them sequentially.  
**HOW TO USE:**

1. **Analyze**: Break the request into independent sub-tasks.  
2. **Dispatch**: Run asyncwf taskmgr dispatch \--job client\_v1 \--prompt "Write the Rust network struct..." and asyncwf taskmgr dispatch \--job backend\_v1 \--prompt "Write the Python Modal app...".  
3. **Wait**: Run asyncwf taskmgr wait \--jobs client\_v1,backend\_v1.  
4. **Fetch & Integrate**: Run asyncwf taskmgr fetch ... to see what your sub-agents wrote.  
5. **Review**: Check for consistency between the two outputs.

**CONSTRAINTS:**

* Sub-agents cannot see your current conversation history. You must provide full context in the \--prompt.  
* Always check asyncwf link status before starting to ensure specs are up to date.

### **5\. Implementation Stack**

* **Language:** Node.js (compiled to single binary via pkg or just global npm).  
* **Agent Spawning:**  
  * Uses child\_process.spawn to run claude or llm (if installed) in a new shell.  
  * **Optimization:** Can fallback to direct API calls (Anthropic SDK) if claude CLI overhead is too high.  
* **State Management:** lowdb (local JSON file) for tracking PIDs and exit codes.  
* **Context Linking:** Standard fs.symlink.

### **6\. Workflow Example**

**User:** "Build the login system. I need a Rust handler and a Postgres migration."

Claude (Main Agent):  
(Internal Monologue: This requires two different languages. Parallelizing.)

1. Executes: asyncwf taskmgr dispatch \--job rust\_login \--prompt "Write a Rust Actix handler for user login..."  
2. Executes: asyncwf taskmgr dispatch \--job db\_migration \--prompt "Write a SQL migration for the users table..."  
3. Executes: asyncwf taskmgr wait \--jobs rust\_login,db\_migration  
4. Executes: asyncwf taskmgr fetch \--job rust\_login  
5. Executes: asyncwf taskmgr fetch \--job db\_migration  
6. **Response:** "I have dispatched agents to write the handler and migration. Here are the results..."
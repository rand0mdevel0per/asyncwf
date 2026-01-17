import { existsSync, readdirSync, readFileSync, writeFileSync, symlinkSync, lstatSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { generateClaudeMD, generateProjectContext } from '../lib/templates.js';

export async function linkCommand(): Promise<void> {
    const cwd = process.cwd();
    const projectName = basename(cwd);

    console.log(chalk.cyan(`🔗 Linking project: ${projectName}\n`));

    // 1. Scan specs/*.md
    const specsDir = join(cwd, 'specs');
    if (!existsSync(specsDir)) {
        console.log(chalk.red('✗ No specs/ directory found. Run `asyncwf init` first.'));
        return;
    }

    const specFiles = readdirSync(specsDir).filter(f => f.endsWith('.md'));
    if (specFiles.length === 0) {
        console.log(chalk.yellow('⚠ No .md files found in specs/'));
    } else {
        console.log(chalk.green(`✓ Found ${specFiles.length} spec files:`));
        specFiles.forEach(f => console.log(chalk.gray(`  • ${f}`)));
    }

    // 2. Create symlink to ~/.ckb/projects/<project>
    const ckbProjectsDir = join(homedir(), '.ckb', 'projects');
    const linkPath = join(ckbProjectsDir, projectName);

    try {
        if (existsSync(linkPath)) {
            const stat = lstatSync(linkPath);
            if (stat.isSymbolicLink()) {
                console.log(chalk.gray(`• Symlink already exists: ${linkPath}`));
            } else {
                console.log(chalk.yellow(`⚠ ${linkPath} exists but is not a symlink`));
            }
        } else {
            symlinkSync(cwd, linkPath, 'junction'); // 'junction' for Windows compatibility
            console.log(chalk.green(`✓ Created symlink: ~/.ckb/projects/${projectName}`));
        }
    } catch (error) {
        console.log(chalk.red(`✗ Failed to create symlink: ${error}`));
    }

    // 3. Generate project context from specs
    const specs: Array<{ name: string; summary: string }> = [];
    for (const file of specFiles) {
        const content = readFileSync(join(specsDir, file), 'utf-8');
        // Extract first heading or first line as summary
        const lines = content.split('\n').filter(l => l.trim());
        let summary = 'No description';

        // Find first heading
        const headingMatch = content.match(/^#\s+(.+)$/m);
        if (headingMatch) {
            summary = headingMatch[1];
        } else if (lines.length > 0) {
            summary = lines[0].slice(0, 100);
        }

        specs.push({
            name: file.replace('.md', ''),
            summary,
        });
    }

    // 4. Update claude.md with project context
    const claudeMdPath = join(cwd, 'claude.md');
    const projectContext = generateProjectContext(specs);
    const newContent = generateClaudeMD(projectContext);

    writeFileSync(claudeMdPath, newContent);
    console.log(chalk.green('✓ Updated claude.md with project context'));

    console.log(chalk.cyan('\n✨ Project linked successfully!'));
    console.log(chalk.gray(`\nAvailable specs in context: ${specs.length}`));
}

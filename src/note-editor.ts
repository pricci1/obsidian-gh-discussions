import type { App } from "obsidian";

export class NoteEditor {
  constructor(private readonly app: App) {}

  updateNoteFrontmatter(
    notePath: string,
    newFrontmatter: Record<string, unknown>,
  ): Promise<void> {
    const file = this.app.vault.getFileByPath(notePath);
    if (!file) {
      throw new Error(`File not found: ${notePath}`);
    }
    return new Promise((resolve) => {
      this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        Object.assign(frontmatter, newFrontmatter);
      });
      resolve();
    });
  }
}

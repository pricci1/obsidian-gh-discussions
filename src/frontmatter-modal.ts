import { type App, Modal } from "obsidian";
import type { NoteStore } from "./main";

export class FrontmatterModal extends Modal {
  store: NoteStore;

  constructor(app: App, store: NoteStore) {
    super(app);
    this.store = store;
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    const notes = await this.store.getNotesFromTargetDirectory();

    if (notes.length === 0) {
      contentEl.createEl("p", {
        text: "No notes found in the specified directory or no directory configured.",
      });
      return;
    }

    contentEl.createEl("h2", { text: "Notes Frontmatter" });

    for (const note of notes) {
      const noteContainer = contentEl.createDiv("note-container");
      noteContainer.style.marginBottom = "20px";
      noteContainer.style.padding = "10px";
      noteContainer.style.border =
        "1px solid var(--background-modifier-border)";
      noteContainer.style.borderRadius = "4px";

      noteContainer.createEl("h3", { text: note.filename });
      noteContainer.createEl("p", {
        text: `Path: ${note.path}`,
        cls: "note-path",
      }).style.fontSize = "0.8em";

      if (Object.keys(note.frontmatter).length > 0) {
        const frontmatterContainer = noteContainer.createDiv(
          "frontmatter-container",
        );
        frontmatterContainer.createEl("strong", { text: "Frontmatter:" });

        for (const [key, value] of Object.entries(note.frontmatter)) {
          const prop = frontmatterContainer.createDiv("frontmatter-prop");
          prop.style.marginLeft = "10px";
          prop.createEl("span", { text: `${key}: ` }).style.fontWeight = "bold";
          prop.createEl("span", { text: JSON.stringify(value) });
        }
      } else {
        noteContainer.createEl("p", {
          text: "No frontmatter found",
          cls: "no-frontmatter",
        }).style.fontStyle = "italic";
      }
    }
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

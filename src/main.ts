import { type App, Modal, Notice, Plugin } from "obsidian";
import { MyPluginSettingTab } from "./settings-tab";

interface MyPluginSettings {
  targetDirectory: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  targetDirectory: "",
};

interface NoteFrontmatter {
  filename: string;
  path: string;
  frontmatter: Record<string, unknown>;
}

export type PluginWithSettings = Plugin & {
  settings: MyPluginSettings;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
};

export default class MyPlugin extends Plugin implements PluginWithSettings {
  settings: MyPluginSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    const ribbonIconEl = this.addRibbonIcon(
      "dice",
      "Sample Plugin",
      (evt: MouseEvent) => {
        new Notice("This is a notice!");
      },
    );
    ribbonIconEl.addClass("my-plugin-ribbon-class");

    const statusBarItemEl = this.addStatusBarItem();
    statusBarItemEl.setText("Status Bar Text");

    this.addCommand({
      id: "show-frontmatter-list",
      name: "Show frontmatter from notes",
      callback: () => {
        new FrontmatterModal(this.app, this).open();
      },
    });

    this.addSettingTab(new MyPluginSettingTab(this.app, this));
  }

  onunload(): void {}

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async getNotesFromTargetDirectory(): Promise<NoteFrontmatter[]> {
    const notes: NoteFrontmatter[] = [];

    if (!this.settings.targetDirectory) {
      return notes;
    }

    const files = this.app.vault.getMarkdownFiles();
    const targetDir = this.settings.targetDirectory.endsWith("/")
      ? this.settings.targetDirectory
      : `${this.settings.targetDirectory}/`;

    for (const file of files) {
      if (file.path.startsWith(targetDir)) {
        const fileCache = this.app.metadataCache.getFileCache(file);
        const frontmatter = fileCache?.frontmatter || {};

        notes.push({
          filename: file.name,
          path: file.path,
          frontmatter: frontmatter,
        });
      }
    }

    return notes;
  }
}

class FrontmatterModal extends Modal {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const notes = await this.plugin.getNotesFromTargetDirectory();

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

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

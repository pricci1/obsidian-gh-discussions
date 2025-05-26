import { Notice, Plugin } from "obsidian";
import { FrontmatterModal } from "./frontmatter-modal";
import { MyPluginSettingTab } from "./settings-tab";

interface MyPluginSettings {
  targetDirectory: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  targetDirectory: "",
};

interface NoteInfo {
  filename: string;
  path: string;
  frontmatter: Record<string, unknown>;
}

export interface NoteStore {
  getNotesFromTargetDirectory(): Promise<NoteInfo[]>;
}

export type PluginWithSettings = Plugin & {
  settings: MyPluginSettings;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
};

export default class MyPlugin
  extends Plugin
  implements PluginWithSettings, NoteStore
{
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

  async getNotesFromTargetDirectory(): Promise<NoteInfo[]> {
    const notes: NoteInfo[] = [];

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

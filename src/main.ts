import { Notice, Plugin, type TFile } from "obsidian";
import { FrontmatterModal } from "./frontmatter-modal";
import { GithubClient } from "./github-client";
import { NoteEditor } from "./note-editor";
import { NotePusher } from "./note-pusher";
import { MyPluginSettingTab } from "./settings-tab";
import type { PushableNote } from "./types";

interface MyPluginSettings {
  targetDirectory: string;
  githubToken: string;
  repoUrl: string;
  categories: string[][];
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  targetDirectory: "",
  githubToken: "",
  repoUrl: "",
  categories: [],
};

interface NoteInfo {
  filename: string;
  path: string;
  frontmatter: Record<string, unknown>;
}

export interface NoteStore {
  getNotesFromTargetDirectory(): Promise<NoteInfo[]>;
}

interface SettingsStore {
  settings: MyPluginSettings;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export type PluginWithSettings = Plugin & SettingsStore;

export default class MyPlugin
  extends Plugin
  implements PluginWithSettings, NoteStore
{
  settings!: MyPluginSettings;
  private notePusher!: NotePusher;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.initializeNotePusher();
    this.setupUI();
  }

  private initializeNotePusher(): void {
    const ghClient = new GithubClient(
      this.settings.githubToken,
      this.settings.repoUrl,
    );
    const editor = new NoteEditor(this.app);
    this.notePusher = new NotePusher(ghClient, editor);
  }

  private setupUI(): void {
    this.addPushToDiscussionRibbonIcon();
    this.addShowFrontmatterCommand();
    this.addSettingTab(new MyPluginSettingTab(this.app, this));
  }

  private addPushToDiscussionRibbonIcon(): void {
    const ribbonIconEl = this.addRibbonIcon(
      "github",
      "Push to discussion",
      this.handlePushToDiscussion.bind(this),
    );
    ribbonIconEl.addClass("my-plugin-ribbon-class");
  }

  private addShowFrontmatterCommand(): void {
    this.addCommand({
      id: "show-frontmatter-list",
      name: "Show frontmatter from notes",
      callback: () => {
        new FrontmatterModal(this.app, this).open();
      },
    });
  }

  private async fileToPushableNote(file: TFile): Promise<PushableNote> {
    const frontmatter = this.extractFrontmatter(file);
    const rawContent = await this.app.vault.read(file);
    const categoryId = this.settings.categories
      .find((categoryPair) => categoryPair.at(0) === frontmatter.category)
      ?.at(1);

    return {
      filePath: file.path,
      categoryId,
      rawContent,
      title: file.basename,
      labels: frontmatter.labels ?? [],
    };
  }

  private async handlePushToDiscussion(): Promise<void> {
    const file = this.app.workspace.activeEditor?.file;
    if (!file) {
      new Notice("No active editor");
      return;
    }

    try {
      const pushableNote = await this.fileToPushableNote(file);
      await this.notePusher.push(pushableNote);

      new Notice(`Successfully pushed ${file.path} to discussion`);
    } catch (error) {
      new Notice(`Error pushing note: ${error.message}`);
      console.error(error);
    }
  }

  private extractFrontmatter(file: TFile): Record<string, unknown> {
    const fileCache = this.app.metadataCache.getFileCache(file);
    return fileCache?.frontmatter || {};
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
    const targetDir = this.normalizeTargetDirectory();

    for (const file of files) {
      if (file.path.startsWith(targetDir)) {
        const frontmatter = this.extractFrontmatter(file);

        notes.push({
          filename: file.name,
          path: file.path,
          frontmatter,
        });
      }
    }

    return notes;
  }

  private normalizeTargetDirectory(): string {
    return this.settings.targetDirectory.endsWith("/")
      ? this.settings.targetDirectory
      : `${this.settings.targetDirectory}/`;
  }
}

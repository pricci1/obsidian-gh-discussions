import { Notice, Plugin, type TFile } from "obsidian";
import { z } from "zod/v4";
import { FrontmatterModal } from "./frontmatter-modal";
import { GithubClient } from "./github-client";
import { NoteEditor } from "./note-editor";
import { NotePusher } from "./note-pusher";
import { SettingTab } from "./settings-tab";
import type { PushableNote } from "./types";

interface PushToGHDPluginSettings {
  targetDirectory: string;
  githubToken: string;
  repoUrl: string;
  categories: string[][];
}

const DEFAULT_SETTINGS: PushToGHDPluginSettings = {
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
  settings: PushToGHDPluginSettings;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export type PluginWithSettings = Plugin & SettingsStore;

export default class PushToGHDPlugin
  extends Plugin
  implements PluginWithSettings, NoteStore
{
  settings!: PushToGHDPluginSettings;
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
    this.addSettingTab(new SettingTab(this.app, this));
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
    const CategoryAndLabelSchema = z.object({
      category: z
        .string({ error: "Unknown category. Make sure it exists in settings." })
        .min(1)
        .transform((category) =>
          this.settings.categories
            .find(
              (categoryPair) =>
                categoryPair.at(0)?.toLowerCase() === category.toLowerCase(),
            )
            ?.at(1),
        )
        .pipe(
          z
            .string({
              error: "Unknown category. Make sure it exists in settings.",
            })
            .min(1),
        ),
      labels: z.array(z.string()).min(1).optional().default([]),
    });
    const { category: categoryId, labels } = CategoryAndLabelSchema.parse(
      this.extractFrontmatter(file),
    );
    const rawContent = await this.app.vault.read(file);

    return {
      filePath: file.path,
      categoryId,
      rawContent,
      title: file.basename,
      labels,
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
      if (error instanceof z.ZodError) {
        new Notice(`Error pushing note: ${z.prettifyError(error)}`);
      } else {
        new Notice("Error pushing note");
      }
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

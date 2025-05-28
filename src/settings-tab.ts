import { type App, PluginSettingTab, Setting } from "obsidian";
import { CategoriesSettingComponent } from "./categories-setting";
import type { PluginWithSettings } from "./main";

export class SettingTab extends PluginSettingTab {
  plugin: PluginWithSettings;

  constructor(app: App, plugin: PluginWithSettings) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Notes Directory")
      .setDesc(
        "Specify the directory path to read notes from (e.g., 'folder' or 'folder/subfolder')",
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter directory path")
          .setValue(this.plugin.settings.targetDirectory)
          .onChange(async (value) => {
            this.plugin.settings.targetDirectory = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("GitHub Token")
      .setDesc("Personal access token for GitHub API authentication")
      .addText((text) =>
        text
          .setPlaceholder("ghp_...")
          .setValue(this.plugin.settings.githubToken)
          .onChange(async (value) => {
            this.plugin.settings.githubToken = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Repository URL")
      .setDesc(
        "GitHub repository URL (e.g., 'https://github.com/owner/repo-name')",
      )
      .addText((text) =>
        text
          .setPlaceholder("https://github.com/owner/repo-name")
          .setValue(this.plugin.settings.repoUrl)
          .onChange(async (value) => {
            this.plugin.settings.repoUrl = value;
            await this.plugin.saveSettings();
          }),
      );

    new CategoriesSettingComponent(containerEl, this.plugin);
  }
}

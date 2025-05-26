import { type App, PluginSettingTab, Setting } from "obsidian";
import type { PluginWithSettings } from "./main";

export class MyPluginSettingTab extends PluginSettingTab {
  plugin: PluginWithSettings;

  constructor(app: App, plugin: PluginWithSettings) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Frontmatter Reader Settings" });

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
  }
}

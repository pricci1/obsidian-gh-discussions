import type { PluginWithSettings } from "./main";

export class CategoriesSettingComponent {
  private categoriesListContainer!: HTMLElement;

  constructor(
    private readonly container: HTMLElement,
    private readonly plugin: PluginWithSettings,
  ) {
    this.render();
  }

  private render(): void {
    const categoriesContainer = this.container.createDiv();
    categoriesContainer.createEl("h4", { text: "Categories" });
    categoriesContainer.createEl("p", {
      text: "Map category names to GitHub discussion category IDs",
      cls: "setting-item-description",
    });

    this.categoriesListContainer = categoriesContainer.createDiv({
      cls: "categories-list",
    });

    this.renderCategoriesList();

    const addCategoryContainer = categoriesContainer.createDiv({
      cls: "add-category-container",
    });

    let newCategoryName = "";
    let newCategoryId = "";

    const nameInput = addCategoryContainer.createEl("input", {
      type: "text",
      placeholder: "Category name",
      cls: "category-input",
    });

    const idInput = addCategoryContainer.createEl("input", {
      type: "text",
      placeholder: "Category ID",
      cls: "category-input",
    });

    const addButton = addCategoryContainer.createEl("button", {
      text: "Add Category",
      cls: "mod-cta",
    });

    nameInput.addEventListener("input", (e) => {
      newCategoryName = (e.target as HTMLInputElement).value;
    });

    idInput.addEventListener("input", (e) => {
      newCategoryId = (e.target as HTMLInputElement).value;
    });

    addButton.addEventListener("click", async () => {
      if (newCategoryName.trim() && newCategoryId.trim()) {
        if (!this.plugin.settings.categories) {
          this.plugin.settings.categories = [];
        }
        this.plugin.settings.categories.push([
          newCategoryName.trim(),
          newCategoryId.trim(),
        ]);
        await this.plugin.saveSettings();

        nameInput.value = "";
        idInput.value = "";
        newCategoryName = "";
        newCategoryId = "";

        this.renderCategoriesList();
      }
    });

    addCategoryContainer.style.display = "flex";
    addCategoryContainer.style.gap = "8px";
    addCategoryContainer.style.marginTop = "12px";
    nameInput.style.flex = "1";
    idInput.style.flex = "1";
  }

  private renderCategoriesList(): void {
    this.categoriesListContainer.empty();

    if (
      !this.plugin.settings.categories ||
      this.plugin.settings.categories.length === 0
    ) {
      this.categoriesListContainer.createEl("p", {
        text: "No categories configured",
        cls: "setting-item-description",
      });
      return;
    }

    this.plugin.settings.categories.forEach((category, index) => {
      const categoryItem = this.categoriesListContainer.createDiv({
        cls: "category-item",
      });

      const categoryInfo = categoryItem.createDiv({ cls: "category-info" });
      categoryInfo.createEl("strong", { text: category[0] });
      categoryInfo.createEl("span", { text: ` (ID: ${category[1]})` });

      const removeButton = categoryItem.createEl("button", {
        text: "Remove",
        cls: "mod-warning",
      });

      removeButton.addEventListener("click", async () => {
        this.plugin.settings.categories.splice(index, 1);
        await this.plugin.saveSettings();
        this.renderCategoriesList();
      });

      categoryItem.style.display = "flex";
      categoryItem.style.justifyContent = "space-between";
      categoryItem.style.alignItems = "center";
      categoryItem.style.padding = "8px";
      categoryItem.style.border = "1px solid var(--background-modifier-border)";
      categoryItem.style.borderRadius = "4px";
      categoryItem.style.marginBottom = "4px";
    });
  }
}

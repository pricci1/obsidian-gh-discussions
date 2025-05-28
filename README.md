# Obsidian Push note to GitHub Discussions Plugin

Push Obsidian notes to a repo's GitHub Discussions. Configure categories and labels through frontmatter, then publish notes to your repository's discussion section.

## Features

- Configure discussion categories and labels through note frontmatter
- Automatic label creation if labels don't exist in the repository

## Usage

1. Configure GitHub personal access token in plugin settings
  - A fine-grained token with access to the target repository
    - With permission to write discussions and issues (to create labels)
2. Set target repository URL
3. Define discussion categories mapping
  - Maps the category name used in the note's frontmatter to a discussion's category id
4. Add frontmatter to notes with `category` and optional `labels` fields

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Develop with watch mode
bun run dev

# Run tests
bun run test
```

## Get discussion category ids

```graphql
query {
  repository(owner: "username", name: "repo-name") {
    discussionCategories(first: 25) {
      nodes {
        id
        name
      }
    }
  }
}
```

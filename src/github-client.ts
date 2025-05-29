import { Octokit } from "@octokit/core";
import type { RemoteClient } from "./types";

interface CreateDiscussionParams {
  categoryId: string;
  title: string;
  rawContent: string;
  labels: string[];
}

interface CreateDiscussionResult {
  id: string;
  updatedAt: string;
}

export class GithubClient implements RemoteClient {
  private readonly client: Octokit;
  constructor(
    token: string,
    private readonly repoUrl: string,
  ) {
    this.client = new Octokit({ auth: token });
  }

  async createDiscussion({
    categoryId,
    title,
    rawContent,
    labels,
  }: CreateDiscussionParams): Promise<CreateDiscussionResult> {
    const { owner, repo } = this.parseRepoUrl();
    const repositoryId = await this.getRepositoryId(owner, repo);

    const discussion = await this.createDiscussionMutation(
      repositoryId,
      categoryId,
      title,
      rawContent,
    );

    if (labels.length > 0) {
      await this.attachLabelsToDiscussion(repositoryId, discussion.id, labels);
    }

    return {
      id: discussion.id,
      updatedAt: discussion.updatedAt,
    };
  }

  async updateDiscussion(
    discussionId: string,
    { categoryId, title, rawContent, labels }: CreateDiscussionParams,
  ): Promise<CreateDiscussionResult> {
    const { owner, repo } = this.parseRepoUrl();
    const repositoryId = await this.getRepositoryId(owner, repo);

    const discussion = await this.updateDiscussionMutation(
      discussionId,
      categoryId,
      title,
      rawContent,
    );

    if (labels && labels.length > 0) {
      await this.attachLabelsToDiscussion(repositoryId, discussion.id, labels);
    }

    return {
      id: discussion.id,
      updatedAt: discussion.updatedAt,
    };
  }

  private parseRepoUrl(): { owner: string; repo: string } {
    const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = this.repoUrl.match(urlPattern);
    if (!match) {
      throw new Error(`Invalid repository URL: ${this.repoUrl}`);
    }
    return { owner: match[1], repo: match[2] };
  }

  private async getRepositoryId(owner: string, repo: string): Promise<string> {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          id
        }
      }
    `;

    const response = await this.client.graphql(query, {
      owner,
      repo,
    });
    return (response as any).repository.id;
  }

  private async createDiscussionMutation(
    repositoryId: string,
    categoryId: string,
    title: string,
    body: string,
  ): Promise<{ id: string; updatedAt: string }> {
    const mutation = `
      mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
        createDiscussion(input: {
          repositoryId: $repositoryId,
          categoryId: $categoryId,
          title: $title,
          body: $body
        }) {
          discussion {
            id
            updatedAt
          }
        }
      }
    `;

    const response = await this.client.graphql(mutation, {
      repositoryId,
      categoryId,
      title,
      body,
    });
    return (response as any).createDiscussion.discussion;
  }

  private async updateDiscussionMutation(
    discussionId: string,
    categoryId?: string,
    title?: string,
    body?: string,
  ): Promise<{ id: string; updatedAt: string }> {
    const variables: Record<string, unknown> = { discussionId };
    const inputFields: string[] = ["discussionId: $discussionId"];

    if (categoryId !== undefined) {
      variables.categoryId = categoryId;
      inputFields.push("categoryId: $categoryId");
    }
    if (title !== undefined) {
      variables.title = title;
      inputFields.push("title: $title");
    }
    if (body !== undefined) {
      variables.body = body;
      inputFields.push("body: $body");
    }

    const mutationVariables = [
      "$discussionId: ID!",
      categoryId !== undefined ? "$categoryId: ID" : null,
      title !== undefined ? "$title: String" : null,
      body !== undefined ? "$body: String" : null,
    ]
      .filter(Boolean)
      .join(", ");

    const mutation = `
      mutation(${mutationVariables}) {
        updateDiscussion(input: {
          ${inputFields.join(",\n          ")}
        }) {
          discussion {
            id
            updatedAt
          }
        }
      }
    `;

    const response = await this.client.graphql(mutation, variables);
    return (response as any).updateDiscussion.discussion;
  }

  private async attachLabelsToDiscussion(
    repositoryId: string,
    discussionId: string,
    labelNames: string[],
  ): Promise<void> {
    const labelIds = await this.ensureLabelsExist(repositoryId, labelNames);

    if (labelIds.length > 0) {
      const mutation = `
        mutation($labelableId: ID!, $labelIds: [ID!]!) {
          addLabelsToLabelable(
            input: {
              labelableId: $labelableId,
              labelIds: $labelIds
            }
          ) {
            clientMutationId
          }
        }
      `;

      await this.client.graphql(mutation, {
        labelableId: discussionId,
        labelIds,
      });
    }
  }

  private async ensureLabelsExist(
    repositoryId: string,
    labelNames: string[],
  ): Promise<string[]> {
    const existingLabels = await this.getExistingLabels(repositoryId);
    const labelIds: string[] = [];

    for (const labelName of labelNames) {
      const existingLabel = existingLabels.find(
        (label) => label.name === labelName,
      );

      if (existingLabel) {
        labelIds.push(existingLabel.id);
      } else {
        const newLabelId = await this.createLabel(repositoryId, labelName);
        labelIds.push(newLabelId);
      }
    }

    return labelIds;
  }

  private async getExistingLabels(
    repositoryId: string,
  ): Promise<Array<{ id: string; name: string }>> {
    const query = `
      query($repositoryId: ID!) {
        node(id: $repositoryId) {
          ... on Repository {
            labels(first: 100) {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    `;

    const response = await this.client.graphql(query, {
      repositoryId,
    });
    return (response as any).node.labels.nodes;
  }

  private async createLabel(
    repositoryId: string,
    name: string,
  ): Promise<string> {
    const mutation = `
      mutation($repositoryId: ID!, $name: String!, $color: String!) {
        createLabel(input: {
          repositoryId: $repositoryId,
          name: $name,
          color: $color
        }) {
          label {
            id
          }
        }
      }
    `;

    const response = await this.client.graphql(mutation, {
      repositoryId,
      name,
      color: "FF0000",
    });
    return (response as any).createLabel.label.id;
  }
}

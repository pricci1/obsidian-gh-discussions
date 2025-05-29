import type { NoteEditor, PushableNote, RemoteClient } from "./types";

export class NotePusher {
  constructor(
    private readonly client: RemoteClient,
    private readonly editor: NoteEditor,
  ) {}

  async push(note: PushableNote): Promise<NotePushResult> {
    const discussionData = {
      categoryId: note.categoryId,
      title: note.title,
      rawContent: note.rawContent,
      labels: note.labels,
    };
    const { id: remoteId, updatedAt } = await this.clientOperation(
      note.remoteId,
    )(discussionData);
    await this.editor.updateNoteFrontmatter(note.filePath, {
      remoteId,
      updatedAt,
    });
    return new NotePushResult(true);
  }

  private clientOperation(remoteId: string | undefined = undefined) {
    console.log("remoteId", remoteId);
    if (remoteId) {
      return (data: Parameters<RemoteClient["updateDiscussion"]>["1"]) =>
        this.client.updateDiscussion(remoteId, data);
    }
    return this.client.createDiscussion;
  }
}

export class NotePushResult {
  constructor(public readonly success: boolean) {}
}

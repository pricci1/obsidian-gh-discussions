import type { NoteEditor, PushableNote, RemoteClient } from "./types";

export class NotePusher {
  constructor(
    private readonly client: RemoteClient,
    private readonly editor: NoteEditor,
  ) {}

  async push(note: PushableNote): Promise<NotePushResult> {
    const { id: remoteId, updatedAt } = await this.client.createDiscussion({
      categoryId: note.categoryId,
      title: note.title,
      rawContent: note.rawContent,
      labels: note.labels,
    });
    await this.editor.updateNoteFrontmatter(note.filePath, {
      remoteId,
      updatedAt,
    });
    return new NotePushResult(true);
  }
}

export class NotePushResult {
  constructor(public readonly success: boolean) {}
}

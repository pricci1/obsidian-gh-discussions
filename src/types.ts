export type PushableNote = {
  filePath: string;
  remoteId?: string;
  categoryId: string;
  title: string;
  rawContent: string;
  labels?: string[];
};

export type NoteEditor = {
  updateNoteFrontmatter(
    notePath: string,
    newFrontmatter: Record<string, unknown>,
  ): Promise<void>;
};

export type RemoteClient = {
  createDiscussion(
    note: Omit<PushableNote, "filePath" | "remoteId">,
  ): Promise<{ id: string; updatedAt: string }>;
};

export interface PublicAppNote {
  id: string;
  authorUsername: string;
  authorDisplayName: string;
  authorPhotoURL: string | null;
  message: string;
  createdAt: string;
}

export interface CreateAppNoteInput {
  message: string;
}

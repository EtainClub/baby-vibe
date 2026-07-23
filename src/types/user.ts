export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  photoURL: string | null;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUserProfile {
  username: string;
  displayName: string;
  bio: string;
  photoURL: string | null;
}

export interface CreateProfileInput {
  username: string;
  displayName: string;
  bio: string;
  photoURL?: string | null;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  photoURL?: string | null;
}

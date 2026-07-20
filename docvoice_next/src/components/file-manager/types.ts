export type ManagedItemType = 'file' | 'folder';

export interface ManagedBase {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  itemType: ManagedItemType;
}

export interface ManagedFile extends ManagedBase {
  itemType: 'file';
  size: number;
  mimeType: string;
  url: string;
  path: string;
}

export interface ManagedFolder extends ManagedBase {
  itemType: 'folder';
}

export type ManagedItem = ManagedFile | ManagedFolder;

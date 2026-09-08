export type NodeStatus = 'pending' | 'progress' | 'complete';

export interface NodeLink {
  targetId: string;
  sourceSide?: 'left' | 'right';
  targetSide?: 'left' | 'right';
}

export interface RoadmapNode {
  id: string;
  title: string;
  detail: string;
  state: NodeStatus;
  links: (string | NodeLink)[];
  x: number;
  y: number;
}

export interface RoadmapMap {
  id: string;
  title: string;
  description: string;
  nodes: RoadmapNode[];
}

export type TaskPriority = 'high' | 'med' | 'low';

export interface Task {
  id: string;
  title: string;
  detail: string;
  priority: TaskPriority;
  status: NodeStatus;
  category?: string;
  resourceUrl?: string;
  resourceLabel?: string;
  dueDate: string;
  createdAt: string;
}

export interface NoteFolder {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  sizeBytes?: number;
  category: string;
  type?: string;
  extension?: string;
  dataUrl?: string;
  textContent?: string;
  annotations?: string;
  uploadedAt: string;
}

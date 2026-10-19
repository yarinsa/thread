export interface Anchor {
  selector: string;
  route: string;
  offsetX: number;
  offsetY: number;
}

export interface Comment {
  id: string;
  threadId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  project: string;
  branch: string;
  author: string;
  anchor: Anchor;
  resolved: boolean;
  createdAt: string;
  comments: Comment[];
}

export interface OverlayConfig {
  api: string;
  project: string;
  branch: string;
  author: string;
}

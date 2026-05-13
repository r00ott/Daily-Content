export type BlogStatus = "active" | "archived";
export type SourceStatus = "new" | "processed" | "ignored";
export type ContentStatus = "pending" | "drafted" | "posted";

export interface Blog {
  id: string;
  name: string;
  url: string;
  status: BlogStatus;
  userId: string;
}

export interface PinterestAccount {
  id: string;
  name: string;
  blogId: string;
  handle: string;
  userId: string;
}

export interface Source {
  id: string;
  url: string;
  title?: string;
  excerpt?: string;
  blogId: string;
  status: SourceStatus;
  createdAt: number;
  userId: string;
}

export interface Pin {
  idea: string;
  caption: string;
  status: "pending" | "posted";
}

export interface DailyTask {
  id: string;
  blogId: string;
  date: string; // YYYY-MM-DD
  title: string;
  competitorUrl?: string;
  articleStatus: ContentStatus;
  summary?: string;
  outline?: string;
  draft?: string;
  pins: Pin[];
  userId: string;
}

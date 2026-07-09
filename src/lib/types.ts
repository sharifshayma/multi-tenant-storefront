export type MediaType = "IMAGE" | "VIDEO";

export type BookMediaItem = {
  id: string;
  type: MediaType;
  url: string;
  sortOrder: number;
};

export type BookSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceNis: number;
  coverImage: string;
};

export type BookDetail = BookSummary & {
  media: BookMediaItem[];
};

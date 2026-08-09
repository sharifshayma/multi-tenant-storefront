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
  priceMinor: number;
  coverImage: string;
};

export type BookDetail = BookSummary & {
  media: BookMediaItem[];
};

export type CollectionBookRef = {
  bookId: string;
  slug: string;
  title: string;
  coverImage: string;
};

export type CollectionSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceMinor: number;
  isCustom: boolean;
  requiredCount: number | null;
  books: CollectionBookRef[];
};

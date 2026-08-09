"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type { CollectionBookRef } from "@/lib/types";

export type CartBookItem = {
  id: string;
  kind: "book";
  bookId: string;
  slug: string;
  title: string;
  coverImage: string;
  priceMinor: number;
  quantity: number;
};

export type CartCollectionItem = {
  id: string;
  kind: "collection";
  collectionId: string;
  slug: string;
  title: string;
  priceMinor: number;
  isCustom: boolean;
  selectedBooks: CollectionBookRef[];
  quantity: number;
};

export type CartItem = CartBookItem | CartCollectionItem;

type CartState = {
  items: CartItem[];
  hydrated: boolean;
};

type CartAction =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD_BOOK"; item: Omit<CartBookItem, "id" | "kind" | "quantity">; quantity?: number }
  | {
      type: "ADD_COLLECTION";
      item: Omit<CartCollectionItem, "id" | "kind" | "quantity">;
      quantity?: number;
    }
  | { type: "UPDATE_QTY"; id: string; quantity: number }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "CLEAR" };

const STORAGE_KEY = "argw-cart";

function sameBookSelection(a: CollectionBookRef[], b: CollectionBookRef[]) {
  if (a.length !== b.length) return false;
  const idsA = [...a.map((x) => x.bookId)].sort();
  const idsB = [...b.map((x) => x.bookId)].sort();
  return idsA.every((id, i) => id === idsB[i]);
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true };

    case "ADD_BOOK": {
      const qty = action.quantity ?? 1;
      const existing = state.items.find(
        (i): i is CartBookItem => i.kind === "book" && i.bookId === action.item.bookId
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          { ...action.item, id: genId(), kind: "book", quantity: qty },
        ],
      };
    }

    case "ADD_COLLECTION": {
      const qty = action.quantity ?? 1;
      const existing = state.items.find(
        (i): i is CartCollectionItem =>
          i.kind === "collection" &&
          i.collectionId === action.item.collectionId &&
          sameBookSelection(i.selectedBooks, action.item.selectedBooks)
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          { ...action.item, id: genId(), kind: "collection", quantity: qty },
        ],
      };
    }

    case "UPDATE_QTY": {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case "CLEAR":
      return { ...state, items: [] };

    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  addBook: (item: Omit<CartBookItem, "id" | "kind" | "quantity">, quantity?: number) => void;
  addCollection: (
    item: Omit<CartCollectionItem, "id" | "kind" | "quantity">,
    quantity?: number
  ) => void;
  updateQty: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totalMinor: number;
  totalCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLegacyBookItem(raw: any): boolean {
  return raw && !raw.kind && typeof raw.bookId === "string";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    hydrated: false,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const items: CartItem[] = (Array.isArray(parsed) ? parsed : []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => {
          if (isLegacyBookItem(entry)) {
            return {
              id: genId(),
              kind: "book",
              bookId: entry.bookId,
              slug: entry.slug,
              title: entry.title,
              coverImage: entry.coverImage,
              priceMinor: entry.priceMinor,
              quantity: entry.quantity,
            } as CartBookItem;
          }
          return entry as CartItem;
        }
      );
      dispatch({ type: "HYDRATE", items });
    } catch {
      dispatch({ type: "HYDRATE", items: [] });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items, state.hydrated]);

  const totalMinor = state.items.reduce((sum, i) => sum + i.priceMinor * i.quantity, 0);
  const totalCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  const value: CartContextValue = {
    items: state.items,
    hydrated: state.hydrated,
    addBook: (item, quantity) => dispatch({ type: "ADD_BOOK", item, quantity }),
    addCollection: (item, quantity) => dispatch({ type: "ADD_COLLECTION", item, quantity }),
    updateQty: (id, quantity) => dispatch({ type: "UPDATE_QTY", id, quantity }),
    removeItem: (id) => dispatch({ type: "REMOVE_ITEM", id }),
    clear: () => dispatch({ type: "CLEAR" }),
    totalMinor,
    totalCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

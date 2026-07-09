"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";

export type CartItem = {
  bookId: string;
  slug: string;
  title: string;
  coverImage: string;
  priceNis: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  hydrated: boolean;
};

type CartAction =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity">; quantity?: number }
  | { type: "UPDATE_QTY"; bookId: string; quantity: number }
  | { type: "REMOVE_ITEM"; bookId: string }
  | { type: "CLEAR" };

const STORAGE_KEY = "argw-cart";

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true };
    case "ADD_ITEM": {
      const qty = action.quantity ?? 1;
      const existing = state.items.find((i) => i.bookId === action.item.bookId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.bookId === action.item.bookId
              ? { ...i, quantity: i.quantity + qty }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, quantity: qty }],
      };
    }
    case "UPDATE_QTY": {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.bookId !== action.bookId),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.bookId === action.bookId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.bookId !== action.bookId),
      };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQty: (bookId: string, quantity: number) => void;
  removeItem: (bookId: string) => void;
  clear: () => void;
  totalNis: number;
  totalCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    hydrated: false,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items = raw ? (JSON.parse(raw) as CartItem[]) : [];
      dispatch({ type: "HYDRATE", items });
    } catch {
      dispatch({ type: "HYDRATE", items: [] });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items, state.hydrated]);

  const totalNis = state.items.reduce(
    (sum, i) => sum + i.priceNis * i.quantity,
    0
  );
  const totalCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  const value: CartContextValue = {
    items: state.items,
    hydrated: state.hydrated,
    addItem: (item, quantity) => dispatch({ type: "ADD_ITEM", item, quantity }),
    updateQty: (bookId, quantity) =>
      dispatch({ type: "UPDATE_QTY", bookId, quantity }),
    removeItem: (bookId) => dispatch({ type: "REMOVE_ITEM", bookId }),
    clear: () => dispatch({ type: "CLEAR" }),
    totalNis,
    totalCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

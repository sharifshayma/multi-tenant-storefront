import type { ar } from "./ar";

export const en: typeof ar = {
  common: {
    save: "Save",
    cancel: "Cancel",
    back: "Back",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    loading: "Loading...",
    saving: "Saving...",
  },
  errors: {
    unauthorized: "Not authorized",
    generic: "Something went wrong, please try again",
  },
  store: {
    addToCart: "Add to cart",
    added: "Added",
    addCollectionToCart: "Add collection to cart",
    addedCollection: "Collection added",
    decreaseQty: "Decrease quantity",
    increaseQty: "Increase quantity",
    cart: {
      label: "Cart",
      title: "Cart & checkout",
      empty: {
        title: "Your cart is empty",
        subtitle: "Add some {item} to see them here.",
        browse: "Browse {item}",
      },
      itemSeparator: ", ",
      remove: "Remove",
      total: "Total",
      deliveryInfo: "Delivery details",
      fullName: "Full name",
      phone: "Phone number",
      emailOptional: "Email (optional)",
      city: "City",
      notesOptional: "Notes (optional)",
      submitting: "Submitting...",
      placeOrder: "Place order",
      paymentNote: "No payment now — we'll contact you to arrange delivery and payment.",
    },
    bundle: {
      selectedLabel: "Selected:",
      added: "Added",
    },
    home: {
      collectionsHeading: "Special-price collections",
      individualHeading: "Individual {plural}",
    },
    postOrderNote: "After placing your order, we'll contact you by phone to arrange delivery and payment.",
    collection: {
      includes: "This collection includes:",
    },
    confirmation: {
      title: "Thank you for your order!",
      message: "We've received your order. We'll call you soon at your phone number to arrange delivery and payment.",
    },
    notFound: {
      title: "Page not found",
      message: "We couldn't find what you were looking for.",
    },
    backToStore: "Back to store",
  },
};

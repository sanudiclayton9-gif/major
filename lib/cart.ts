import type { Product } from "./types";

export type CartItem = {
  product: Product;
  quantity: number;
  size?: string;
};

const CART_KEY = "wear-chimsol-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(CART_KEY);

    if (!saved) {
      return [];
    }

    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(
  product: Product,
  quantity = 1,
  size?: string
) {
  const cart = getCart();

  const existingItem = cart.find(
    (item) =>
      item.product.id === product.id &&
      item.size === size
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      product,
      quantity,
      size,
    });
  }

  saveCart(cart);

  return cart;
}

export function removeFromCart(
  productId: number,
  size?: string
) {
  const cart = getCart().filter(
    (item) =>
      !(
        item.product.id === productId &&
        item.size === size
      )
  );

  saveCart(cart);

  return cart;
}

export function updateCartQuantity(
  productId: number,
  quantity: number,
  size?: string
) {
  const cart = getCart();

  const item = cart.find(
    (item) =>
      item.product.id === productId &&
      item.size === size
  );

  if (item) {
    item.quantity = Math.max(1, quantity);
  }

  saveCart(cart);

  return cart;
}

export function clearCart() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(cart: CartItem[]) {
  return cart.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );
}
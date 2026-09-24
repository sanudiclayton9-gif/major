export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sizes: string[];
  images: string[];
  description: string;
  category?: string;
  created_at: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  size?: string;
  qty: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "paid" | "delivered" | "cancelled";
  customer_phone: string;
  customer_name?: string;
  measurements?: string;
  paynow_poll_url?: string;
  created_at: string;
};

export type Review = {
  id: string;
  name: string;
  message: string;
  created_at: string;
};

export type Comment = {
  id: string;
  product_id: string;
  name: string;
  text: string;
  created_at: string;
};

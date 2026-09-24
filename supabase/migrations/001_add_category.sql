-- Migration: add category column to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category text;

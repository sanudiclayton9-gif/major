# Wear Chimsol — Next.js E-commerce Starter

A reusable Zimbabwe-focused e-commerce starter based on the supplied project specification.

## Run locally

1. Install Node.js 18+.
2. Copy `.env.example` to `.env.local` and add credentials.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

## Supabase

Run `supabase/schema.sql` in your Supabase SQL editor. For the `embedding` column, enable pgvector first.

## Important production TODOs

- Replace demo products with Supabase products/storage.
- Implement Supabase Auth/RLS for admin access.
- Complete Paynow SDK `createPayment` and result-hash verification using your Paynow merchant credentials.
- Connect cart state and checkout form to `/api/paynow`.
- Add real product images and `public/og-image.jpg`.
- Set `NEXT_PUBLIC_SITE_URL`.
- Add Google verification token.
- Review webhook security and payment/order idempotency before accepting real payments.

## Business details

Wear Chimsol
No.9 Eston Road, Mabelreign Shopping Centre, Harare, Zimbabwe
WhatsApp: 0775178065
EcoCash: 0775178065

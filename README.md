# Wear Chimsol — full e-commerce rebuild

A complete tailoring shop site: customers browse designs, buy directly online
with EcoCash (via Paynow), get an AI assistant that answers only from your
real catalog, and can leave private feedback. You manage everything from a
password-protected `/admin` dashboard.

## Stack

Next.js 14 (App Router) · Tailwind CSS · Supabase (database) · Paynow
(EcoCash payments) · Google Gemini via the Vercel AI SDK (chat assistant).

## Important: how EcoCash payments actually work here

Paynow is a licensed Zimbabwean payment gateway — it's the thing that
actually talks to EcoCash, not this code directly. Here's what that means:

- When a customer checks out, **they type in their own EcoCash number** and
  approve the charge with their own PIN.
- The money doesn't go to "0775178065" or any number written in this
  code — it settles into **whatever bank account or mobile wallet you
  register with Paynow** when you sign up as a merchant.
- You cannot skip registering with Paynow — there's no way to accept real
  EcoCash payments on a website without going through a licensed gateway
  like Paynow (this is Zimbabwean financial regulation, not a limitation of
  this code).

**To get real Paynow credentials:**
1. Go to [paynow.co.zw](https://www.paynow.co.zw) → **Merchant Sign Up**
2. Complete their KYC process (business/personal details, the bank account
   or mobile wallet you want payments to settle into)
3. Once approved, your dashboard shows an **Integration ID** and
   **Integration Key** — these go in `.env.local` as `PAYNOW_ID` / `PAYNOW_KEY`
4. Paynow provides a **test/sandbox mode** — use this first to confirm
   everything works before going live with real money

## One-time setup

### 1. Supabase (database)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Once created, go to the **SQL Editor** → paste the entire contents of
   `supabase/schema.sql` from this project → **Run**
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click to reveal) → `SUPABASE_SERVICE_ROLE_KEY`
     — this one is secret, never share it or commit it

### 2. Paynow (see above)

Get your `PAYNOW_ID` and `PAYNOW_KEY` from your Paynow merchant dashboard.

### 3. Google Gemini (AI assistant)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in, click **Create API key**
3. Copy it into `GOOGLE_GENERATIVE_AI_API_KEY`

This is free for reasonable usage.

### 4. Choose your admin password

Pick any password, put it in `ADMIN_PASSWORD`. This is what you'll type to
log into `/admin` — keep it private, don't reuse a password from elsewhere.

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in every value in `.env.local` from the steps above, then:

```bash
npm run dev
```

Visit `http://localhost:3000` for the site, `/admin` to sign in and add your
first designs (you'll need at least one before the AI assistant or product
grid have anything to show).

## Deploying (Vercel)

1. Push this project to GitHub — or use the Vercel CLI to deploy directly
   without GitHub:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```
2. In your Vercel project → **Settings → Environment Variables**, add every
   value from your `.env.local` (Vercel doesn't read your local file).
3. Update `NEXT_PUBLIC_SITE_URL` to your real deployed URL once you have
   one — Paynow needs this to send customers back to the right order page,
   and it's used in the site's SEO metadata too.
4. Redeploy after changing environment variables:
   ```bash
   vercel --prod
   ```

## Getting verified by Google (optional, for SEO)

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add your site as a URL-prefix property
3. Choose the **HTML tag** verification method, copy the `content="..."` value
4. Put it in `.env.local` / Vercel env vars as `GOOGLE_SITE_VERIFICATION`
5. Redeploy, then click **Verify** in Search Console

## Adding product photos

There's no file upload built in — paste a **direct image link** per line
when adding a design in `/admin`. Free places to get one:
- [postimages.org](https://postimages.org) — no account needed, gives you a
  direct link immediately
- Test any link first by pasting it into a new browser tab — it should show
  *just* the photo, not a whole webpage around it

## What's intentionally left out of this V1

- **AI-powered image search** (the `embedding` column mentioned in the
  original spec) — this needs vector search infrastructure that adds real
  complexity for limited payoff at this stage. The catalog schema doesn't
  include it, but a `products` table could have it added later.
- **`og-image.jpg`** — add a real photo of your work as
  `public/og-image.jpg` (1200×630px works well) so WhatsApp/social shares
  show a nice preview image.

## Project structure

```
app/
  page.tsx                 homepage: hero, product grid, feedback form
  products/[id]/page.tsx   single product page
  cart/page.tsx            cart + EcoCash checkout
  track/[id]/page.tsx      order status (polls Paynow)
  admin/                   owner dashboard (password-protected)
  api/
    chat/                  AI assistant (Gemini)
    paynow/                payment creation, status polling, webhook
    products/               public product list
    admin/                  product/order/review management (password-protected)
components/                UI pieces (cart context, chat bubble, forms, etc.)
lib/                        Supabase clients, types, business constants
supabase/schema.sql         run this once in Supabase's SQL editor
```

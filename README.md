# TrueHive CRM, POS & AI WhatsApp ERP (`E:\truehive-crm`)

Single-Business AI-Powered WhatsApp Cloud API CRM, Live POS Terminal with Barcode Scanner, BOM Ingredient Auto-Deduction, Cash Flow Ledger, and Live Google Docs / Sheets Reporting System.

## Quick Start

1. Open terminal in `E:\truehive-crm`:
   ```bash
   cd E:\truehive-crm
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your credentials (or run immediately in standalone mode with pre-loaded data):
   ```bash
   copy .env.example .env
   ```
3. Push Prisma schema to Supabase (optional when ready):
   ```bash
   npm run db:push
   npm run db:seed
   ```
   *(Run `prisma/enable_rls.sql` in Supabase SQL Editor to automatically enable Row Level Security on all tables).*
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` (or `http://localhost:3000/login` to test JWT Role-Based Access Control).

# TASK 016 — Invoice System (Detailed Codex Breakdown)

## Objective
Build a full production-grade invoicing module tightly integrated with the Quote system, including:
- Invoice lifecycle management
- Quote → Invoice conversion
- PDF generation
- Email-ready export structure
- Financial calculations done server-side
- Clean React UI with editing + review flows

---

# 🧱 PART 1 — DATABASE & SCHEMA (InstantDB)

## TASK 016.1 — Create Invoice Schema

Implement:

### Invoice Table
- id (uuid)
- invoiceNumber (auto: INV-000001)
- customerId (indexed)
- projectId (nullable)
- quoteId (nullable foreign key)
- status (draft | sent | paid | overdue | void)
- dueDate (nullable)
- issueDate
- subtotal
- taxRate
- taxAmount
- discountAmount (optional future proofing)
- total
- createdBy
- createdAt
- updatedAt

---

## TASK 016.2 — Invoice Line Items Model

Implement embedded or relational structure:

### LineItem
- id
- invoiceId
- description
- quantity
- unitPrice
- total (calculated server-side)

Rules:
- Never trust client totals
- Always recompute on save

---

## TASK 016.3 — Invoice Number Generator

Create service:

- Sequential numbering
- Format: INV-000001
- Thread-safe increment logic
- Prevent duplicates under concurrency

---

# ⚙️ PART 2 — BUSINESS LOGIC LAYER

## TASK 016.4 — Invoice Calculation Engine

Create `/services/invoiceCalculator.ts`

Responsibilities:
- Calculate subtotal
- Apply tax rate
- Apply discounts (future-ready)
- Return final totals object

Rules:
- Pure function (no DB calls)
- Deterministic output
- Unit-testable

---

## TASK 016.5 — Invoice State Machine

Implement strict transitions:

Allowed transitions:
- draft → sent
- sent → paid
- sent → overdue
- sent → void

Rules:
- Prevent invalid transitions
- Log all transitions (audit ready)

---

## TASK 016.6 — Quote → Invoice Conversion Service

Create:

`/services/convertQuoteToInvoice.ts`

Responsibilities:
- Clone quote line items
- Generate invoice number
- Copy customer + project refs
- Set status = draft
- Lock original quote (converted = true)

Edge cases:
- Prevent double conversion
- Maintain version history

---

# 🌐 PART 3 — API LAYER

## TASK 016.7 — Invoice CRUD APIs

Implement:

### Endpoints

- GET /api/v1/invoices
- GET /api/v1/invoices/:id
- POST /api/v1/invoices
- PUT /api/v1/invoices/:id
- DELETE /api/v1/invoices/:id (soft delete recommended)

Rules:
- Server calculates totals
- Validate all input with schema validation (Zod)

---

## TASK 016.8 — Invoice Actions API

Implement:

- POST /api/v1/invoices/:id/send
- POST /api/v1/invoices/:id/mark-paid
- POST /api/v1/invoices/:id/mark-overdue

Behavior:
- Update status
- Trigger notification hook (stub for now)
- Log action event

---

## TASK 016.9 — Quote Conversion API

- POST /api/v1/quotes/:id/convert-to-invoice

Must:
- Call conversion service
- Return new invoice ID
- Lock quote

---

# 📄 PART 4 — PDF GENERATION SYSTEM (CRITICAL)

## TASK 016.10 — PDF Engine Setup

Choose implementation:
- Puppeteer (preferred)
- OR pdfkit fallback

Create:

`/services/pdf/pdfEngine.ts`

Responsibilities:
- Render HTML → PDF
- Return buffer/stream
- Support A4 format

---

## TASK 016.11 — Invoice PDF Template

Create:

`/services/pdf/templates/invoiceTemplate.ts`

Must include:
- Company header (configurable placeholder)
- Invoice number
- Customer details
- Issue + due date
- Line item table
- Subtotal / tax / total
- Status watermark (PAID / VOID)

Rules:
- Must be print-perfect A4
- Must support multi-page line items
- Table headers repeat on page break

---

## TASK 016.12 — Quote PDF Template (Shared Base)

Create shared base:

`/services/pdf/templates/baseTemplate.ts`

Shared features:
- Branding header
- Footer section
- Table renderer
- Styling system

---

## TASK 016.13 — PDF Endpoints

Implement:

- GET /api/v1/invoices/:id/pdf
- GET /api/v1/quotes/:id/pdf

Rules:
- Must stream file
- Must not store PDF on disk (unless debug mode)
- Must reflect latest saved state

---

# 💻 PART 5 — FRONTEND (REACT)

## TASK 016.14 — Invoice List Page

Features:
- Table view
- Filters:
  - status
  - customer
  - date range
- Quick actions:
  - view
  - download PDF
  - mark paid

---

## TASK 016.15 — Invoice Detail Page

Must include:
- Invoice summary header
- Editable status (role-based)
- Line item display
- PDF button
- Send button (stub email integration)
- Audit timeline (future-ready placeholder)

---

## TASK 016.16 — Invoice Editor (Core UI)

Build full editor:

Features:
- Add/remove line items
- Editable grid:
  - description
  - qty
  - unit price
- Auto-calculated totals
- Save draft
- Validation warnings

Rules:
- Debounced calculations
- No API calls per keystroke

---

## TASK 016.17 — Quote → Invoice UI Flow

On Quote page:

Add button:
- “Convert to Invoice”

Flow:
1. Confirm modal
2. Call conversion API
3. Redirect to invoice detail page

---

# 🧮 PART 6 — UI COMPONENTS

## TASK 016.18 — Line Item Table Component

Reusable component:

- Editable rows
- Add/remove row
- Auto total per row
- Keyboard-friendly navigation

---

## TASK 016.19 — Invoice Totals Panel

Displays:
- Subtotal
- Tax breakdown
- Grand total

Must update live

---

# 🔒 PART 7 — VALIDATION & SAFETY

## TASK 016.20 — Input Validation Layer

Use Zod schemas for:
- invoice creation
- invoice updates
- line items

Rules:
- Reject negative quantities
- Reject invalid prices
- Enforce required fields

---

## TASK 016.21 — Server-Side Recalculation Enforcement

On every write:
- Ignore client totals
- Recalculate everything
- Persist computed values only

---

# 📊 PART 8 — AUDIT & TRACKING

## TASK 016.22 — Invoice Audit Log (light version)

Track:
- status changes
- invoice creation
- conversion events
- PDF downloads (optional)

Store:
- userId
- action
- timestamp

---

# 📦 OUTPUT REQUIREMENTS FOR CODEX

Codex must produce:

- Fully working backend module
- Fully working React UI
- PDF generation service
- InstantDB schema definitions
- No pseudo-code
- No placeholders like “TODO later”
- Modular service-based structure
- Clean TypeScript throughout

---

# 🚨 CRITICAL RULES

- Do NOT modify auth system
- Do NOT refactor unrelated modules
- Keep invoice logic isolated in `/invoices`
- All calculations must be server authoritative
- UI must match ERP styling system

---

# 💡 SUCCESS CRITERIA

System is complete when:

- Invoice can be created from scratch
- Invoice can be generated from quote
- Invoice totals are correct and server-calculated
- PDF downloads match UI exactly
- Invoice lifecycle works end-to-end
- UI is fully usable without backend hacks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 1: Vision
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I am building a SaaS product for independent café owners.

PROBLEM:
Independent cafés use printed menus and manual ordering,
which is slow, costly to update, and creates friction at busy
times. There is no affordable, non-technical digital solution
built for small café operators.

SOLUTION:
A subscription-based SaaS where café owners self-onboard,
build their menu visually, get a QR code, and their customers
can scan → browse → order → pay from their phone.

TARGET USERS:
- Primary: Independent café owners (non-technical, 1–3 locations)
- Secondary: Café customers (mobile-first, want fast ordering)

BUSINESS MODEL:
- Subscription per café location (monthly/yearly)
- Tiered plans: display-only → full ordering + payments

TASK:
Help me think through the system actors, key modules, and
any blindspots in this concept before I start technical planning.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 2: Master Context
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT: CaféOS — SaaS Web Application
PURPOSE: Enable independent café owners to digitalize their menu
and offer customers a full scan → browse → order → pay experience
via subscription.

ACTORS:
1. Super Admin — full platform control, manages subscriptions & cafés
2. Café Owner — manages their own café: menu, orders, analytics, QR
3. Café Staff — views and updates order statuses only
4. Customer — no account, scans QR, orders, and pays

TASK:
Generate a complete Master Context Document including:
- System architecture overview
- Actor responsibility matrix (table format)
- Data ownership map (which actor owns which data)
- Core system rules that govern all actors

Architecture rules to follow in all future work:
- Modular, multi-tenant architecture (each café is isolated)
- Role-based access control (SuperAdmin > Owner > Staff > Customer)
- Clean separation of concerns
- Consistent API response format: { success, data, message }
- Reusable component structure
- Subscription gate: features locked behind active plan


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 3: Module Context
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT: CaféOS — Subscription SaaS
PURPOSE: Independent café owners digitalize their menu and
offer customers a full scan → browse → order → pay experience.

ACTORS: Super Admin, Café Owner, Café Staff, Customer

For EACH module below, generate a Module Context Card with:
- Module name and purpose (2 sentences)
- Actor table (actor | can do | cannot do)
- Feature list (bullet points)
- Key business rules (numbered)
- Dependencies on other modules

MODULES:
1. Auth & Subscription
2. Café Management
3. Menu Builder
4. Customer Ordering
5. Order Management
6. Analytics Dashboard
7. Super Admin Panel

ARCHITECTURE RULES:
- Multi-tenant: every café's data is fully isolated
- Subscription gate: Module 3, 4, 5, 6 require active plan
- Role-based access: SuperAdmin > Owner > Staff > Customer
- Customer has NO account — identified by session only
- Consistent API responses: { success, data, message }


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4: Module 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Auth: JWT-based
- Payments: manual (no gateway in v1)

MODULE: Auth & Subscription
PURPOSE: Identity management for Café Owners and Super Admin,
plus subscription plan control and feature gating.

BUSINESS RULES:
1. Email verified before dashboard access
2. Only Super Admin activates/changes subscriptions
3. Basic = menu display only; Pro = full ordering + analytics
4. Expired plan → auto-unpublish menu, block new orders
5. One subscription per café location
6. Super Admin account is seeded, not self-registered

STATUSES:
- Account: Unverified | Active | Suspended
- Subscription: Pending | Active | Expired | Cancelled

EDGE CASES:
- Unverified account resend flow
- Plan expires mid-service (graceful degradation)
- Basic user hitting Pro-only feature (upgrade prompt)
- Password reset before email verification

VALIDATION:
- email: valid format, unique
- password: min 8 chars, 1 number
- café name: 2–60 chars
- plan: enum [basic, pro]
- expiry: future date, Admin-set only

TASK:
Generate a complete, production-ready implementation plan
for this module including:
- Feature breakdown with acceptance criteria
- Data flow diagram (text description)
- Business logic implementation notes
- Error scenario handling plan
- Test case outline

Do NOT generate code yet. Generate the implementation
blueprint only.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4: Module 2 — Café Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE SPEC: Café Management
==============================
Purpose: Manages everything about the café's identity and
public presence — profile, branding, QR code, hours, and
open/closed status. This is the foundation customers see
before they even browse the menu.

FEATURES:
  1. Café Profile: name, logo upload, address, phone,
     short description
  2. Operating Hours: set open/close times per day,
     mark days as closed
  3. Open/Closed Toggle: manual override regardless
     of operating hours
  4. Theme Customization: primary color, background color
     for the customer-facing menu page
  5. QR Code: auto-generated on café creation, permanent,
     points to /menu/{cafe-slug}
  6. QR Download: downloadable as PNG and PDF
  7. Café Slug: unique URL-friendly identifier generated
     from café name (e.g. "sunrise-cafe")

─────────────────────────────────────────────

USER JOURNEYS:

  Café Owner — First-time setup:
    1. After registration + plan activation, lands on
       setup checklist
    2. Fills in café profile (name, logo, address)
    3. Sets operating hours
    4. Picks theme colors
    5. QR code auto-generated and shown
    6. Downloads QR as PNG or PDF to print

  Café Owner — Daily operation:
    1. Logs in → toggles café to Open
    2. At end of day → toggles to Closed
    3. Customers scanning QR while closed see
       "We're closed right now" screen

  Café Owner — Updating profile:
    1. Goes to Settings → Café Profile
    2. Updates any field
    3. Changes reflect immediately on customer menu page

─────────────────────────────────────────────

BUSINESS RULES:
  1. QR is generated once at café creation and never
     changes — always points to /menu/{cafe-slug}
  2. Café slug is auto-generated from café name,
     must be unique across the platform
  3. If slug conflicts, append a short random suffix
     (e.g. "sunrise-cafe-4x2")
  4. Logo must be image file only (JPG/PNG), max 2MB
  5. Café profile must be completed before menu is
     accessible to customers
  6. If subscription expires, /menu/{cafe-slug} shows
     "café unavailable" — QR still works, just blocked
  7. Open/Closed toggle overrides operating hours
     (manual always wins)

─────────────────────────────────────────────

STATUSES:
  Café Profile:  Incomplete | Complete
  Café Status:   Open | Closed
  Menu Page:     Accessible | Unavailable (subscription gate)

─────────────────────────────────────────────

EDGE CASES:
  - Owner changes café name after QR is printed:
      → slug and QR do NOT change, only display name
        updates (this is why QR is slug-based not
        name-based)
  - Two cafés try to register same name:
      → second gets auto-suffixed slug, both work fine
  - Owner uploads oversized logo:
      → rejected with clear error, size limit shown
  - Customer scans QR when café is closed:
      → sees friendly "closed" screen with
        operating hours displayed
  - Customer scans QR when subscription expired:
      → sees "this café is currently unavailable"
        with no menu shown

─────────────────────────────────────────────

VALIDATION RULES:
  café name:   2–60 chars, required
  slug:        auto-generated, lowercase, hyphens only,
               unique platform-wide
  logo:        JPG/PNG only, max 2MB
  address:     max 120 chars
  phone:       valid format, optional
  description: max 200 chars, optional
  theme color: valid hex code
  hours:       open time must be before close time

  

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4: Module 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Auth: JWT-based
- Payments: manual (no gateway in v1)

MODULE: Menu Builder
PURPOSE: Full menu creation and management — categories,
items, structured modifiers with pricing, availability
toggles, dietary tags, and publish control.

BUSINESS RULES:
1. Min 1 category + 1 item required before publish
2. Deleting category deletes all its items (confirm first)
3. Modifier group needs min 2 options
4. Required modifier blocks cart add until selected
5. Modifier price adjustment >= 0 (no negative discounts)
6. Sold-out items visible but not orderable
7. Unpublished menu = invisible to all customers
8. Orders store item + modifier snapshot at order time
   (not a live reference — menu changes don't affect
   past orders)

STATUSES:
- Menu: Draft | Published | Unpublished
- Item: Available | Sold Out
- Category: Active | Deleted (soft)

EDGE CASES:
- Category delete with items (confirmation required)
- Publish attempt with empty menu (blocked)
- Modifier group deleted after orders placed (snapshot)
- Photo upload failure (item saves without photo)
- Negative modifier price (validation error)

VALIDATION:
- item name: 2–80 chars
- base price: > 0, 2 decimal max
- modifier adj: >= 0, 2 decimal max
- photo: JPG/PNG, max 2MB
- modifier group: min 2 options
- dietary tags: enum values only

TASK:
Generate a complete, production-ready implementation plan
for this module including:
- Feature breakdown with acceptance criteria
- Data flow diagram (text description)
- Business logic implementation notes
- Error scenario handling plan
- Test case outline

Do NOT generate code yet. Generate the implementation
blueprint only.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4: Module 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Auth: JWT for staff/owner — NO auth for customers
- Payments: manual (no gateway in v1)

MODULE: Customer Ordering
PURPOSE: Full public-facing ordering experience. No login
required. Customer scans QR → browses → builds cart →
places order → tracks status in real time.

BUSINESS RULES:
1. No customer account ever required
2. Session token (UUID) identifies customer, 2hr expiry
3. Menu accessible only if: café Open + Active sub +
   Published menu (all three must be true)
4. Sold-out items visible, non-interactive
5. All required modifiers must be selected before
   adding to cart
6. Cart persists in localStorage until order placed
7. Table number required for dine-in only
8. Order cannot be modified after placement
9. Order number sequential per café, resets daily
10. Order trackable via /order/{order-token}

STATUSES:
- Order: New | Preparing | Ready | Served | Cancelled
- Cart: Active | Checked Out

EDGE CASES:
- Item goes sold-out between cart add and checkout
- Café closes between browsing and order placement
- Session expiry during long browsing session
- Race condition on last available item
- Invalid table number input
- Customer returns to track order after closing browser

VALIDATION:
- order type: enum [dine-in, takeaway]
- table number: numeric, 1–999, dine-in only
- order note: max 200 chars
- cart: min 1 item
- required modifiers: all must be selected

TASK:
Generate a complete, production-ready implementation plan
for this module including:
- Feature breakdown with acceptance criteria
- Data flow diagram (text description)
- Business logic implementation notes
- Real-time order status update strategy (WebSocket
  or polling recommendation)
- Error scenario handling plan
- Test case outline

Do NOT generate code yet. Generate the implementation
blueprint only.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4: Module 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Auth: JWT for staff/owner — NO auth for customers
- Payments: manual (no gateway in v1)

MODULE: Order Management
PURPOSE: Real-time order queue for staff and owners.
Receive, track, and update orders during service with
sound + visual alerts. Owner has history and cancel
access; staff manages live status updates only.

BUSINESS RULES:
1. Status moves forward only: New→Preparing→Ready→Served
2. Only owner can cancel (not served orders)
3. Cancellation requires reason (min 5 chars)
4. Served + Cancelled auto-move to history
5. Sound alert on active tab; badge on inactive tab
6. Real-time via WebSocket — no manual refresh
7. Daily order numbers reset at midnight café local time
8. Staff cannot access order history
9. Multi-staff real-time sync — all see same state
10. Cancelled orders soft-deleted, visible in history

STATUSES:
- New | Preparing | Ready | Served | Cancelled
- Staff transitions: New→Preparing→Ready→Served
- Owner can cancel any non-Served order

EDGE CASES:
- Simultaneous status update by two staff (last write wins)
- Browser closes mid-shift (reconnect + resync)
- Cancel attempt on served order (blocked)
- Internet disconnection (banner + auto-reconnect)
- Empty queue state
- New order arrives while staff on history tab

VALIDATION:
- Status transitions must follow allowed flow
- Cancellation reason: 5–200 chars, required
- Date filter: start <= end
- Order number search: numeric only

TASK:
Generate a complete, production-ready implementation plan
for this module including:
- Feature breakdown with acceptance criteria
- Data flow diagram (text description)
- WebSocket architecture plan (connection management,
  events, reconnection strategy)
- Business logic implementation notes
- Error scenario handling plan
- Test case outline

Do NOT generate code yet. Generate the implementation
blueprint only.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4: Module 6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Auth: JWT for staff/owner — NO auth for customers
- Payments: manual (no gateway in v1)

MODULE: Analytics Dashboard
PURPOSE: Business performance insights for café owners.
Revenue, order volume, peak hours, best sellers, and
category performance — all calculated from Served order
totals. Owner-only access.

BUSINESS RULES:
1. Owner access only — staff blocked
2. Figures based on Served orders only
3. Revenue = sum of (item price + modifier adjustments)
   × quantity for all Served orders in range
4. Today's data refreshes on load + every 5 minutes
5. Historical data cached (static after day ends)
6. Custom date range max 90 days
7. CSV export mirrors current filtered view
8. Empty range shows empty state, not error
9. Per-café isolation — owner sees only own data

CHARTS & METRICS:
- KPI cards: today revenue, today orders,
  month revenue, month orders
- Revenue line chart (daily, selected range)
- Orders bar chart (daily, selected range)
- Peak hours heatmap (hour × day of week)
- Best-selling items top 10 (qty + revenue)
- Category performance (revenue + order count)
- Dine-in vs takeaway split (count + %)

DATE PRESETS: Today | Last 7 Days | Last 30 Days |
              This Month | Custom (max 90 days)

EDGE CASES:
- Zero orders in selected range (empty state)
- Custom range > 90 days (validation error)
- Brand new café with no orders (onboarding state)
- Large export on big date range (loading + auto-download)

VALIDATION:
- Custom start/end: cannot be future dates
- End >= start date
- Max span: 90 days

TASK:
Generate a complete, production-ready implementation plan
for this module including:
- Feature breakdown with acceptance criteria
- Data aggregation strategy (which queries power
  each chart — optimized for read performance)
- Caching strategy for historical vs live data
- CSV export implementation approach
- Error and empty state handling plan
- Test case outline

Do NOT generate code yet. Generate the implementation
blueprint only.



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 4: Module 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Auth: JWT-based
- Payments: manual (no gateway in v1)

MODULE: Super Admin Panel
PURPOSE: Platform-level control for the SaaS owner.
Manage all café accounts, manually control subscriptions,
monitor platform KPIs, impersonate owners for support.
Completely separate portal from café owner dashboard.

BUSINESS RULES:
1. Separate portal: /admin prefix, own JWT guard
2. Single seeded Super Admin — no registration
3. Super Admin account cannot be suspended via UI
4. Every impersonation session logged (café, timestamp)
5. Suspended owner: blocked from login + menu unavailable
6. Subscription expiry set manually (no auto-renewal)
7. Plan edits affect new subscriptions only
8. Admin is read + account management only —
   cannot edit menus or place orders

STATUSES:
- Café Account: Active | Suspended
- Subscription: Pending | Active | Expired | Cancelled
- Impersonation: Active | Ended (logged)

EDGE CASES:
- Expiry date set in past (validation blocks)
- Activate subscription on suspended account
  (must reactivate account first)
- Simultaneous admin impersonation + owner login
  (both sessions independent — no conflict)
- Suspension with active live orders
  (current orders complete, new orders blocked)

VALIDATION:
- Expiry date: today or future only
- Plan: enum [basic, pro]
- Search: min 2 chars
- Suspension reason: optional, max 200 chars

TASK:
Generate a complete, production-ready implementation plan
for this module including:
- Feature breakdown with acceptance criteria
- Impersonation architecture (how JWT switching works
  safely without security risks)
- Data flow diagram (text description)
- Business logic implementation notes
- Audit logging plan for sensitive actions
- Error scenario handling plan
- Test case outline

Do NOT generate code yet. Generate the implementation
blueprint only.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 5: Chunk Execution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Auth: JWT-based (role-aware)
- Payments: manual (no gateway in v1)
- Real-time: WebSocket for orders

CURRENT TASK: Chunk [N] of [Total] — [Chunk Name]

SPECIFIC GOAL:
[Paste the single chunk description here]

TECH STACK:
- Frontend: [React / Next.js + Tailwind]
- Backend: [Node.js + Express]
- Database: [PostgreSQL]
- ORM: [Prisma]
- Auth: JWT
- Real-time: Socket.io
- File uploads: [Multer + local/S3]

ARCHITECTURE RULES:
- Controller → Service → Repository pattern
- No business logic in controllers
- Centralized error handling middleware
- JWT auth + role guard on all protected routes
- Zod validation on all API inputs
- Consistent response: { success, data, message }
- Multi-tenant: always filter by cafeId
- No mock data — use real DB calls

EXPECTED DELIVERABLES:
- Folder structure for this chunk
- All files needed (controller, service, schema,
  component, hook — whatever applies)
- Example request/response if API chunk
- Validation schema if input is involved
- Error handling for all failure scenarios

Generate production-ready code for this chunk only.
Do not generate other chunks.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 5: Chunk Execution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Auth: JWT-based (role-aware)
- Payments: manual (no gateway in v1)
- Real-time: WebSocket for orders

CURRENT TASK: Chunk [N] of [Total] — [Chunk Name]

SPECIFIC GOAL:
[Paste the single chunk description here]

TECH STACK:
- Frontend: [React / Next.js + Tailwind]
- Backend: [Node.js + Express]
- Database: [PostgreSQL]
- ORM: [Prisma]
- Auth: JWT
- Real-time: Socket.io
- File uploads: [Multer + local/S3]

ARCHITECTURE RULES:
- Controller → Service → Repository pattern
- No business logic in controllers
- Centralized error handling middleware
- JWT auth + role guard on all protected routes
- Zod validation on all API inputs
- Consistent response: { success, data, message }
- Multi-tenant: always filter by cafeId
- No mock data — use real DB calls

EXPECTED DELIVERABLES:
- Folder structure for this chunk
- All files needed (controller, service, schema,
  component, hook — whatever applies)
- Example request/response if API chunk
- Validation schema if input is involved
- Error handling for all failure scenarios

Generate production-ready code for this chunk only.
Do not generate other chunks.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 6: Database Schema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT: CaféOS — Subscription SaaS
DATABASE: PostgreSQL
ORM: Prisma

Design a production-ready database schema for CaféOS.

ENTITIES TO MODEL:
plans, admin_users, cafe_owners, subscriptions,
cafes, operating_hours, cafe_staff, menus,
categories, items, dietary_tags, item_dietary_tags,
modifier_groups, modifier_options, orders,
order_items, order_item_modifiers, impersonation_logs

KEY DESIGN DECISIONS:
- UUID primary keys on all tables
- created_at + updated_at on all tables
- Soft delete (deleted_at) on: categories, items,
  modifier_groups, modifier_options, orders
- order_items + order_item_modifiers are permanent
  snapshots — never deleted
- cafe_id denormalized on categories, items,
  modifier_groups for fast multi-tenant queries
- daily_number scoped to (cafe_id + order_date)
- order_token UUID for public customer tracking

RELATIONSHIPS:
- cafe_owner has one subscription, one cafe
- cafe has one menu, many categories, many staff,
  many orders, 7 operating_hours rows
- category has many items
- item has many modifier_groups, many dietary_tags
- modifier_group has many modifier_options
- order has many order_items
- order_item has many order_item_modifiers
- order_items + modifiers store name/price snapshots

CONSTRAINTS:
- base_price > 0
- price_adj >= 0
- quantity > 0
- total_amount >= 0

INDEXES:
- cafes: slug (unique), owner_id (unique)
- orders: (cafe_id, created_at),
          order_token (unique),
          (cafe_id, daily_number, order_date) unique
- items: (category_id, sort_order),
         (cafe_id, availability)

DELIVER:
- Complete Prisma schema file (schema.prisma)
- All enums defined
- All relations defined with proper onDelete rules
- Index definitions
- Migration file structure recommendation
- Seed file outline (admin + plans + dietary_tags)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 7: API Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Auth: JWT (owner/staff/admin) — no auth for customers
- Real-time: Socket.io for order events
- Payments: manual (no gateway in v1)

Build the complete backend API for CaféOS.

TECH STACK:
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT authentication
- Socket.io for real-time
- Multer for file uploads
- Zod for validation

ARCHITECTURE RULES:
- Controller → Service → Repository pattern
- No business logic in controllers
- Centralized error handling middleware
- JWT auth middleware + role guard middleware
  (roles: admin | owner | staff | public)
- Subscription gate middleware on Pro routes
- Multi-tenant: always filter queries by cafe_id
- Soft delete: all queries filter deleted_at IS NULL
- Consistent response: { success, data, message }
- Zod validation on all request bodies

ROUTE GROUPS:
/api/auth        → Auth & Subscription
/api/cafe        → Café Management
/api/menu        → Menu Builder
/api/public      → Customer Ordering (no auth)
/api/orders      → Order Management
/api/analytics   → Analytics
/api/admin       → Super Admin

WEBSOCKET EVENTS:
- Server emits to café room (cafe:{cafeId}):
    order:new       → new order placed
    order:updated   → status changed
    order:cancelled → order cancelled
- Server emits to customer room
  (order:{orderToken}):
    order:updated   → status for customer tracker

DELIVER:
- Folder structure
- Express app setup with all middleware
- Route files per module
- Controller + Service + Repository per module
- Zod validation schemas
- JWT middleware (3 variants: owner, staff, admin)
- Subscription gate middleware
- Socket.io room management setup
- Error handling middleware
- Example request/response per endpoint


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI PROMPT — Phase 8: Frontend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT CONTEXT:
- Project: CaféOS — Subscription SaaS
- Purpose: Independent café owners digitalize their menu;
  customers scan QR → browse → order → pay
- Actors: Super Admin, Café Owner, Café Staff, Customer
- Multi-tenant: each café's data is fully isolated
- Payments: manual (no gateway in v1)
- Real-time: Socket.io for order events

TECH STACK:
- React + TanStack Router
- TanStack Query (server state)
- Zustand (client state: cart, auth, socket, ui)
- Tailwind CSS
- React Hook Form + Zod (forms)
- Socket.io client (real-time)
- Recharts (analytics charts)
- Sonner (toasts)
- Lucide React (icons)

THREE PORTALS:
1. Customer  → /menu/:slug (public, mobile-first)
2. Dashboard → /dashboard (owner + staff, JWT)
3. Admin     → /admin (super admin, JWT)

ARCHITECTURE RULES:
- TanStack Router file-based routing
- Protected routes via beforeLoad auth check
- Role-based route filtering
  (staff redirected from owner-only pages)
- TanStack Query for all API calls
  (no direct fetch in components)
- Zustand for cart, auth token, socket,
  UI state only
- Custom hooks wrap all data + socket logic
- No business logic in components
- Loading, error, and empty states on
  every async component
- Mobile-first responsive design
- Optimistic updates on toggles
  (availability, open/closed)
- Subscription gate: Pro features show
  upgrade prompt on Basic plan

STORES:
- cartStore (localStorage persisted)
- sessionStore (customer UUID, 2hr)
- authStore (JWT + role + user)
- socketStore (instance + status)
- uiStore (sidebar, alerts, sound)

KEY CUSTOM HOOKS:
- useMenu, useCart, useOrders,
  useOrderStatus, useAnalytics,
  useSocket, useSoundAlert,
  useSubscriptionGate, useImpersonation

DELIVER:
- Folder structure
- TanStack Router route tree
- Layout components (3 layouts)
- All page components
- All shared/domain components
- All Zustand stores
- All custom hooks
- API service layer
  (axios instance + per-module services)
- Protected route setup with role guards
- Socket.io integration setup
- Form schemas (Zod) per form



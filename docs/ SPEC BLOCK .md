━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 1: Idea Investigation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project Name:     CaféOS (working title)
Type:             SaaS Web Application
Target Users:     Independent café owners + their customers

Problem Solved:
  Independent cafés rely on printed menus, verbal ordering,
  and manual billing — slow, error-prone, and expensive to update.
  There's no affordable, plug-and-play digital solution built
  specifically for small, non-technical café operators.

Vision:
  A subscription SaaS where any café owner can sign up, build
  their menu in minutes, generate a QR code, and immediately
  offer customers a full scan → browse → order → pay experience
  — with zero coding required.

Business Model:
  - Monthly/yearly subscription per café location
  - Tiers likely: Basic (menu display) → Pro (ordering + payments)
  - Revenue scales with number of subscribed cafés

Core Value Props:
  1. No developer needed — self-serve onboarding
  2. Real-time menu control from any device
  3. Full ordering + payment flow out of the box
  4. Analytics to understand what sells

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
📄 SPEC BLOCK — Phase 3: Module Decomposition
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE BREAKDOWN
================

Module 1: Auth & Subscription
  Primary Actor(s): Super Admin, Café Owner
  Core Responsibility: Handles sign up, login, plan selection,
    and gating features behind active subscriptions.
  Sub-features:
    - Café Owner registration & email verification
    - Login / logout / password reset
    - Subscription plan selection (Basic / Pro)
    - Stripe/payment gateway integration for billing
    - Plan upgrade / downgrade / cancellation
    - Feature access gating based on active plan
    - Super Admin login (separate portal)
  Depends On: Nothing — must be built first
  Priority: 1 (must-have)

─────────────────────────────────────────────

Module 2: Café Management
  Primary Actor(s): Café Owner, Super Admin
  Core Responsibility: Manages the café's public profile,
    operating settings, and QR code generation.
  Sub-features:
    - Café profile (name, logo, address, hours)
    - QR code generation (unique per café)
    - QR code download (PNG/PDF)
    - Café theme/color customization (menu appearance)
    - Operating hours configuration
    - Café status (open / closed toggle)
  Depends On: Module 1 (Auth & Subscription)
  Priority: 1 (must-have)

─────────────────────────────────────────────

Module 3: Menu Builder
  Primary Actor(s): Café Owner
  Core Responsibility: Allows owners to create and manage
    their full menu — categories, items, pricing, availability.
  Sub-features:
    - Category management (create, reorder, delete)
    - Menu item management (name, description, price, photo)
    - Item availability toggle (in-stock / sold out)
    - Item variants & modifiers (size, extras, add-ons)
    - Allergen & dietary tags (vegan, gluten-free, etc.)
    - Menu publish / unpublish toggle
  Depends On: Module 1, Module 2
  Priority: 1 (must-have)

─────────────────────────────────────────────

Module 4: Customer Ordering
  Primary Actor(s): Customer (no login required)
  Core Responsibility: The public-facing menu experience —
    customers scan QR, browse, build a cart, and place an order.
  Sub-features:
    - Public menu page (accessed via QR link)
    - Category browsing & item detail view
    - Cart management (add, remove, adjust quantity)
    - Modifier/add-on selection per item
    - Order placement (table number or takeaway)
    - Payment (card, mobile wallet via Stripe)
    - Order confirmation screen + receipt
  Depends On: Module 2, Module 3
  Priority: 1 (must-have)

─────────────────────────────────────────────

Module 5: Order Management
  Primary Actor(s): Café Staff, Café Owner
  Core Responsibility: Live order queue where staff receive,
    track, and update the status of all incoming orders.
  Sub-features:
    - Live order queue (real-time updates)
    - Order status flow: New → Preparing → Ready → Served
    - Order detail view (items, modifiers, table/type)
    - Manual order status update by staff
    - Order history (searchable, filterable)
    - New order notification (sound/visual alert)
  Depends On: Module 4
  Priority: 1 (must-have)

─────────────────────────────────────────────

Module 6: Analytics Dashboard
  Primary Actor(s): Café Owner
  Core Responsibility: Gives owners insight into sales
    performance, popular items, and revenue trends.
  Sub-features:
    - Daily/weekly/monthly revenue summary
    - Best-selling items ranking
    - Orders volume by time of day
    - Category performance breakdown
    - Export reports (CSV)
  Depends On: Module 5
  Priority: 2 (important)

─────────────────────────────────────────────

Module 7: Super Admin Panel
  Primary Actor(s): Super Admin
  Core Responsibility: Platform-level control — manage all
    cafés, subscriptions, and monitor SaaS health.
  Sub-features:
    - All cafés list (search, filter, suspend)
    - Subscription overview (active, churned, revenue)
    - Plan management (create/edit pricing tiers)
    - Impersonate café owner for support
    - Platform-wide stats (MRR, active cafés, orders)
  Depends On: All modules
  Priority: 2 (important)

─────────────────────────────────────────────

BUILD ORDER:
  Module 1 (Auth & Subscription)
    → Module 2 (Café Management)
      → Module 3 (Menu Builder)
        → Module 4 (Customer Ordering)
          → Module 5 (Order Management)
            → Module 6 (Analytics)
            → Module 7 (Super Admin Panel)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4: Module 1 — Auth & Subscription
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE SPEC: Auth & Subscription
==================================
Purpose: Handles all identity (registration, login, password
reset) for Café Owners and Super Admin, and controls feature
access based on subscription plan status.

FEATURES:
  1. Café Owner Registration: email, café name, password,
     email verification before access granted
  2. Login / Logout: email + password, JWT token issued
  3. Password Reset: email-based reset link
  4. Subscription Plan Selection: owner picks Basic or Pro
     after registration
  5. Manual Subscription Activation: Super Admin manually
     marks a café's subscription as active after payment
     is confirmed offline
  6. Plan Expiry & Access Gating: expired plan = locked out
     of Pro features, menu unpublished automatically
  7. Super Admin Login: separate credentials, separate portal

─────────────────────────────────────────────

USER JOURNEYS:

  Café Owner — Registration:
    1. Visits signup page
    2. Enters name, email, café name, password
    3. Receives verification email → clicks link
    4. Redirected to plan selection page
    5. Chooses Basic or Pro
    6. Lands on dashboard (limited until Admin activates)

  Café Owner — Login:
    1. Enters email + password
    2. JWT issued → redirected to dashboard
    3. If subscription expired → banner shown, Pro
       features locked

  Super Admin — Activating a subscription:
    1. Logs into admin portal
    2. Finds café owner account
    3. Sets plan (Basic/Pro) + expiry date manually
    4. Owner's features unlock immediately

─────────────────────────────────────────────

BUSINESS RULES:
  1. Email must be verified before any dashboard access
  2. Only Super Admin can activate or change a subscription
  3. Basic plan: menu display only (no ordering/payments)
  4. Pro plan: full ordering + payments + analytics
  5. Expired subscription → menu unpublished automatically,
     owner sees renewal prompt, customers see
     "café unavailable" page
  6. One subscription = one café location
  7. Super Admin cannot self-register — account seeded
     manually in the database

─────────────────────────────────────────────

STATUSES:
  Café Owner Account: Unverified | Active | Suspended
  Subscription:       Pending | Active | Expired | Cancelled

─────────────────────────────────────────────

EDGE CASES:
  - Owner signs up but never verifies email:
      → account stays Unverified, resend email option
  - Owner's plan expires mid-day while café is busy:
      → ongoing active orders complete normally,
        new orders blocked, menu unpublished after
        current session ends
  - Owner tries to access Pro feature on Basic plan:
      → upgrade prompt shown, feature blocked
  - Super Admin accidentally activates wrong café:
      → Admin can correct plan/expiry at any time
  - Owner forgets password before email is verified:
      → must re-verify first, then reset password

─────────────────────────────────────────────

VALIDATION RULES:
  email:     valid format, unique in system
  password:  min 8 chars, at least 1 number
  café name: min 2 chars, max 60 chars
  plan:      must be one of [basic, pro]
  expiry:    must be a future date (set by Admin only)


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
📄 SPEC BLOCK — Phase 4: Module 3 — Menu Builder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE SPEC: Menu Builder
==========================
Purpose: Allows café owners to build and manage their full
menu — categories, items, structured modifiers, pricing,
availability, and dietary tags — with changes reflecting
instantly on the customer-facing menu page.

FEATURES:
  1. Category Management: create, rename, reorder,
     delete categories (e.g. Hot Drinks, Pastries, Lunch)
  2. Menu Item Management: name, description, price,
     photo, category assignment
  3. Item Photo Upload: optional image per item (JPG/PNG,
     max 2MB)
  4. Structured Modifiers: modifier groups with options
     and price adjustments (e.g. Size: Small +$0 /
     Medium +$0.50 / Large +$1.00)
  5. Modifier Rules: each group can be required or
     optional, single-select or multi-select
  6. Item Availability Toggle: mark item as available
     or sold out (instantly reflected)
  7. Dietary & Allergen Tags: vegan, vegetarian,
     gluten-free, contains nuts, contains dairy, spicy
  8. Menu Publish / Unpublish: owner controls whether
     the full menu is visible to customers
  9. Item Ordering: drag-and-drop reorder within
     a category

─────────────────────────────────────────────

USER JOURNEYS:

  Café Owner — Building menu from scratch:
    1. Goes to Menu Builder
    2. Creates first category (e.g. "Hot Drinks")
    3. Adds item: name, description, base price, photo
    4. Adds modifier group: "Size" → required,
       single-select
       Options: Small ($0) / Medium (+$0.50) /
       Large (+$1.00)
    5. Adds another modifier group: "Extras" →
       optional, multi-select
       Options: Extra Shot (+$0.30) / Oat Milk (+$0.40)
    6. Tags item as vegan
    7. Saves item — appears in category instantly
    8. Repeats for all items
    9. Hits "Publish Menu" when ready

  Café Owner — Mid-service update:
    1. Item runs out → toggles it to "Sold Out"
    2. Customer menu reflects change in real time
    3. Item restocked → toggles back to Available

  Café Owner — Updating a price:
    1. Opens item → edits base price or modifier price
    2. Saves → live immediately on customer menu

─────────────────────────────────────────────

BUSINESS RULES:
  1. A menu must have at least 1 category and 1 item
     before it can be published
  2. Deleting a category deletes all items inside it
     — owner must confirm this action
  3. A modifier group must have at least 2 options
  4. Required modifier = customer cannot add item to
     cart without selecting an option from that group
  5. Optional modifier = customer can skip the group
  6. Single-select modifier = pick exactly one option
  7. Multi-select modifier = pick one or more options
  8. Base price must be > 0
  9. Modifier price adjustment can be 0 (no extra cost)
     but cannot be negative
  10. Sold-out items are visible on customer menu but
      cannot be added to cart
  11. Unpublished menu = customers see nothing,
      even with valid QR

─────────────────────────────────────────────

STATUSES:
  Menu:     Draft | Published | Unpublished
  Item:     Available | Sold Out
  Category: Active | Deleted (soft delete)

─────────────────────────────────────────────

EDGE CASES:
  - Owner deletes category with items inside:
      → confirmation dialog: "This will delete X items.
        Continue?" — hard delete on confirm
  - Owner tries to publish with no items:
      → blocked with message "Add at least one item
        before publishing"
  - Owner removes a modifier group that was used in
    past orders:
      → modifier removed from menu, past orders
        retain their snapshot (orders store item +
        modifiers at time of order, not live reference)
  - Item photo upload fails:
      → item saves without photo, owner can retry
        upload separately
  - Owner sets modifier option price to negative:
      → validation error, minimum is 0
  - Two categories have same name:
      → allowed (owner's choice), no uniqueness
        constraint on category names

─────────────────────────────────────────────

VALIDATION RULES:
  category name:       2–50 chars, required
  item name:           2–80 chars, required
  item description:    max 300 chars, optional
  base price:          numeric, > 0, max 2 decimal places
  item photo:          JPG/PNG only, max 2MB, optional
  modifier group name: 2–50 chars, required
  modifier option name:2–50 chars, required
  modifier price adj:  numeric, >= 0, max 2 decimal places
  min options per group: 2
  dietary tags:        enum [vegan, vegetarian,
                       gluten-free, nuts, dairy, spicy]



━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4: Module 4 — Customer Ordering
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE SPEC: Customer Ordering
================================
Purpose: The entire public-facing experience — customers
scan the QR, browse the menu, build a cart, and place +
confirm an order with no account required. This is the
module customers interact with every single visit.

FEATURES:
  1. Public Menu Page: mobile-optimized, loads via
     /menu/{cafe-slug}, no login required
  2. Café Header: logo, name, open/closed status,
     operating hours
  3. Category Navigation: sticky tab bar to jump
     between categories
  4. Item Cards: photo, name, description, base price,
     dietary tags, sold-out state
  5. Item Detail Modal: full description, photo,
     modifier selection, quantity picker, add to cart
  6. Required Modifier Enforcement: cannot add to cart
     until all required modifier groups are selected
  7. Cart Drawer: sliding cart showing all items,
     modifiers, quantities, subtotal
  8. Order Type Selection: Dine-in or Takeaway
     (at checkout step)
  9. Table Number Input: shown only for Dine-in,
     numeric input, required
  10. Order Note: optional free-text field at checkout
      (max 200 chars)
  11. Order Summary: full itemized review before confirm
  12. Order Placement: submits order → kitchen notified
      in real time
  13. Order Confirmation Screen: order number, estimated
      wait, items summary
  14. Order Status Tracking: customer can see live status
      (New → Preparing → Ready → Served) on confirmation
      screen without refreshing (real-time)

─────────────────────────────────────────────

USER JOURNEYS:

  Customer — Full ordering flow:
    1. Scans QR → lands on /menu/{cafe-slug}
    2. Sees café header with open status
    3. Browses categories via sticky tab nav
    4. Taps item → modal opens with details
    5. Selects required modifiers (e.g. Size: Medium)
    6. Selects optional modifiers (e.g. Oat Milk)
    7. Sets quantity → taps "Add to Cart"
    8. Cart icon updates with item count + subtotal
    9. Taps Cart → drawer slides open
    10. Reviews items, adjusts quantities or removes
    11. Taps "Checkout"
    12. Selects Dine-in → enters table number (e.g. 5)
    13. Adds optional note: "No sugar please"
    14. Reviews full order summary
    15. Taps "Place Order"
    16. Confirmation screen: "Order #42 received!"
    17. Stays on screen to track live status updates

  Customer — Café is closed:
    1. Scans QR → sees closed screen
    2. Café name, logo, and next opening time shown
    3. Cannot browse menu or order

  Customer — Item sold out:
    1. Sees item card with "Sold Out" badge
    2. Cannot tap to open or add to cart

─────────────────────────────────────────────

BUSINESS RULES:
  1. No customer account or login required — ever
  2. Customer session identified by a temporary
     session token (stored in browser, expires after
     order is served or 2 hours)
  3. Menu only accessible if café is Open AND
     subscription is Active AND menu is Published
  4. Sold-out items visible but completely non-interactive
  5. Required modifiers must ALL be selected before
     "Add to Cart" is enabled
  6. Cart persists across page refresh (stored in
     browser localStorage) until order is placed
  7. Table number required for Dine-in, hidden for
     Takeaway
  8. Minimum order: at least 1 item in cart
  9. Once order is placed it cannot be modified
     or cancelled by the customer
  10. Each order gets a unique sequential order number
      per café (e.g. #1, #2, #3 — resets daily)
  11. Order confirmation screen accessible via
      /order/{order-token} so customer can
      return to it if they close the browser

─────────────────────────────────────────────

STATUSES:
  Order: New | Preparing | Ready | Served | Cancelled
  Cart:  Active | Checked Out

─────────────────────────────────────────────

EDGE CASES:
  - Customer adds item, owner marks it sold out
    before checkout:
      → validation at order placement catches it,
        customer shown "Item X is no longer available,
        please remove it from your cart"
  - Café closes mid-browsing:
      → customer can finish viewing cart but on
        "Place Order" tap → blocked with
        "This café is currently closed"
  - Customer leaves browser open for hours, session
    expires, tries to order:
      → shown session expired message, cart cleared,
        prompted to start fresh
  - Two customers order last available item
    simultaneously:
      → first order wins, second gets error at
        placement (not at cart level)
  - Customer enters invalid table number (letters,
    special chars):
      → validation error, numeric only enforced
  - Customer closes confirmation screen then
    wants to recheck status:
      → visits /order/{order-token} to see live status

─────────────────────────────────────────────

VALIDATION RULES:
  order type:     enum [dine-in, takeaway], required
  table number:   numeric only, 1–999, required if dine-in
  order note:     max 200 chars, optional
  cart:           min 1 item required
  modifiers:      all required groups must be selected
  session token:  auto-generated UUID, 2hr expiry
  order token:    auto-generated UUID, used for
                  status tracking URL


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4: Module 5 — Order Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE SPEC: Order Management
===============================
Purpose: Real-time order queue for café staff and owners
to receive, track, and update incoming orders during
service — with instant sound + visual alerts on every
new order.

FEATURES:
  1. Live Order Queue: real-time list of all active
     orders, newest first
  2. New Order Alert: sound chime + visual badge on
     browser tab + highlighted card animation when
     new order arrives
  3. Order Card: shows order number, type (Dine-in /
     Takeaway), table number, items summary, time
     placed, current status
  4. Order Detail View: full breakdown — all items,
     modifiers, quantities, order note, total amount
  5. Status Update: staff taps status button to
     progress order through the flow
     New → Preparing → Ready → Served
  6. Cancel Order: owner only can cancel an order,
     must provide a reason
  7. Order Filters: filter queue by status
     (All / New / Preparing / Ready)
  8. Order History: paginated list of all completed
     and cancelled orders, searchable by order number
     or date
  9. Daily Summary Bar: total orders today, total
     revenue today — shown at top of queue page

─────────────────────────────────────────────

USER JOURNEYS:

  Staff — Managing live orders:
    1. Logs into staff dashboard
    2. Sees live order queue, browser tab shows
       unread order count badge
    3. New order arrives → sound chime plays,
       new card animates in at top
    4. Taps order card → sees full detail
    5. Taps "Start Preparing" → status moves to
       Preparing, customer sees update in real time
    6. Item ready → taps "Mark Ready"
    7. Customer collects / waiter serves →
       taps "Mark Served"
    8. Order moves to history

  Café Owner — Cancelling an order:
    1. Opens order detail
    2. Taps "Cancel Order"
    3. Selects or types cancellation reason
       (e.g. "Item unavailable", "Customer request")
    4. Confirms → order marked Cancelled
    5. Customer's tracking screen shows "Order Cancelled"
       with reason

  Café Owner — Reviewing history:
    1. Goes to Order History tab
    2. Filters by date range or searches by order number
    3. Opens any past order for full detail
    4. Sees daily summary totals at top

─────────────────────────────────────────────

BUSINESS RULES:
  1. Staff can only move orders FORWARD in status
     (New → Preparing → Ready → Served)
     — cannot go backwards
  2. Only Café Owner can cancel an order
  3. Cancellation requires a reason (min 5 chars)
  4. Served and Cancelled orders move out of active
     queue into history automatically
  5. Sound alert plays only when the dashboard tab
     is the active browser tab — visual badge shows
     regardless (even on inactive tab)
  6. Order queue is real-time — no manual refresh
     needed (WebSocket connection)
  7. Daily order number sequence resets at midnight
     café local time
  8. Staff cannot access order history — owners only
  9. Multiple staff can be logged in simultaneously —
     if one updates a status all others see it
     instantly (real-time sync)
  10. Cancelled orders are soft-deleted — still
      visible in history with cancelled status

─────────────────────────────────────────────

STATUSES:
  Order: New | Preparing | Ready | Served | Cancelled

  Allowed transitions:
    Staff:  New → Preparing → Ready → Served
    Owner:  Any status → Cancelled (except Served)

─────────────────────────────────────────────

EDGE CASES:
  - Two staff update same order simultaneously:
      → last write wins, both see updated status
        immediately via WebSocket sync
  - Staff closes browser mid-shift:
      → on reconnect, queue reloads current state,
        no orders lost
  - Owner tries to cancel already-served order:
      → blocked — served orders are final,
        no cancellation allowed
  - Internet drops on staff device:
      → show "Connection lost" banner, reconnect
        automatically when back online,
        queue resyncs on reconnect
  - No orders yet today:
      → empty state: "No orders yet — queue will
        update automatically"
  - New order arrives while staff is in history tab:
      → badge appears on queue tab, sound plays,
        staff can switch back to see it

─────────────────────────────────────────────

VALIDATION RULES:
  status transition:     must follow allowed flow
  cancellation reason:   min 5 chars, max 200 chars,
                         required for cancellation
  order history search:  order number numeric only
  date filter:           start date must be <= end date


  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4: Module 6 — Analytics Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE SPEC: Analytics Dashboard
==================================
Purpose: Gives café owners a clear, visual overview of
their business performance — revenue trends, popular
items, peak hours, and order volumes — all calculated
from order totals, accessible only to the café owner.

FEATURES:
  1. Summary Cards: today's revenue, today's orders,
     this month's revenue, this month's orders —
     shown at the top as quick-glance KPI cards
  2. Revenue Chart: line chart showing daily revenue
     over selected date range (default: last 30 days)
  3. Orders Volume Chart: bar chart showing number of
     orders per day over selected date range
  4. Peak Hours Heatmap: grid showing order volume by
     hour of day across days of the week — highlights
     busiest times visually
  5. Best-Selling Items: ranked list of top 10 items
     by quantity ordered, with revenue contribution
  6. Category Performance: breakdown of revenue and
     order count per menu category
  7. Order Type Split: dine-in vs takeaway ratio
     (count + percentage) for selected period
  8. Date Range Filter: quick presets (Today /
     Last 7 Days / Last 30 Days / This Month /
     Custom Range)
  9. CSV Export: export current filtered data as
     CSV (orders list with totals)

─────────────────────────────────────────────

USER JOURNEYS:

  Café Owner — Daily check:
    1. Logs into dashboard
    2. Sees today's KPI cards at a glance
       (revenue, order count)
    3. Checks if any unusual drop or spike
    4. Done in under 1 minute

  Café Owner — Weekly review:
    1. Goes to Analytics tab
    2. Selects "Last 7 Days" preset
    3. Reviews revenue line chart for trend
    4. Checks peak hours heatmap to plan staffing
    5. Looks at best-selling items to plan restocking
    6. Exports CSV for personal records

  Café Owner — Monthly business review:
    1. Selects "This Month" preset
    2. Reviews category performance to decide if
       any category should be expanded or cut
    3. Checks dine-in vs takeaway split to understand
       customer behavior
    4. Exports CSV to share with accountant

─────────────────────────────────────────────

BUSINESS RULES:
  1. Analytics only accessible to Café Owner —
     staff have no access
  2. All figures based on orders with status Served
     only (excludes Cancelled and still-active orders)
  3. Revenue = sum of all item base prices +
     modifier price adjustments × quantities
     for Served orders in the selected period
  4. Today's figures update in near real-time
     (recalculated on page load + every 5 minutes)
  5. Historical data (past days) is static —
     calculated once and cached
  6. Date range custom filter: max 90 days span
  7. CSV export reflects exactly what is shown
     in the current filtered view
  8. If no orders exist for selected range →
     show empty state per chart, not an error
  9. Analytics are per-café — owner only sees
     their own café's data, never others

─────────────────────────────────────────────

STATUSES:
  Analytics Data:  Current (today) | Historical (past)
  Export:          Idle | Generating | Ready

─────────────────────────────────────────────

EDGE CASES:
  - Owner selects date range with zero orders:
      → charts show empty state with message
        "No orders in this period"
  - Owner selects custom range > 90 days:
      → validation error, max 90 days shown
  - Order cancelled after being served (edge case
    from Module 5 — not allowed, so safe):
      → no impact, served orders are final
  - Café is brand new, no orders yet:
      → all KPI cards show $0 / 0 orders with
        friendly onboarding message
  - CSV export on large date range takes time:
      → loading spinner shown, download triggers
        automatically when ready
  - Two browser tabs open with analytics:
      → each refreshes independently, no conflict

─────────────────────────────────────────────

VALIDATION RULES:
  date range preset:   enum [today, 7days, 30days,
                       this_month, custom]
  custom start date:   cannot be in the future
  custom end date:     cannot be in the future,
                       must be >= start date
  custom range span:   max 90 days
  export format:       CSV only



  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 4: Module 7 — Super Admin Panel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODULE SPEC: Super Admin Panel
================================
Purpose: Platform-level control center for you as the
SaaS owner — manage all café accounts, manually activate
and control subscriptions, monitor platform health, and
handle support tasks.

FEATURES:
  1. Platform KPI Cards: total cafés, active
     subscriptions, total orders today, total
     platform revenue (sum of all café order totals)
  2. Café List: paginated, searchable list of all
     registered cafés with status indicators
  3. Café Detail View: full profile, subscription
     status, order count, registration date
  4. Subscription Management: manually set plan
     (Basic/Pro), set expiry date, activate,
     expire, or cancel any café's subscription
  5. Café Account Actions: suspend or reactivate
     a café account
  6. Impersonate Café Owner: log in as any café
     owner for support purposes — clearly marked
     with "Impersonation Mode" banner
  7. Plan Management: create and edit subscription
     plan definitions (name, price, features list)
  8. Super Admin Account: single seeded account,
     no self-registration, password changeable
     from settings

─────────────────────────────────────────────

USER JOURNEYS:

  Super Admin — Activating a new subscriber:
    1. Café owner signs up and pays manually
    2. Admin logs into admin portal
    3. Searches café by name or email
    4. Opens café detail
    5. Sets plan to Pro, sets expiry date
    6. Clicks Activate → owner's features unlock

  Super Admin — Suspending a bad actor:
    1. Finds café in list
    2. Opens café detail
    3. Clicks Suspend Account
    4. Confirms → café owner cannot log in,
       customer menu shows unavailable

  Super Admin — Supporting an owner:
    1. Owner reports a problem
    2. Admin finds their café
    3. Clicks Impersonate
    4. Sees exactly what owner sees with
       red "Impersonation Mode" banner
    5. Diagnoses issue
    6. Clicks Exit Impersonation → back to admin

  Super Admin — Monitoring platform health:
    1. Lands on admin dashboard
    2. Sees KPI cards: total cafés, active subs,
       today's orders across all cafés
    3. Spots any anomalies

─────────────────────────────────────────────

BUSINESS RULES:
  1. Super Admin portal is completely separate from
     café owner dashboard — different route prefix
     (/admin vs /dashboard)
  2. Only one Super Admin account exists — seeded
     in database, no registration flow
  3. Super Admin cannot be suspended or deleted
     through the UI
  4. Impersonation is logged — every impersonation
     session recorded (who, which café, timestamp)
  5. Suspended café owner cannot log in —
     their customer menu shows unavailable
  6. Subscription expiry set manually — no
     auto-renewal in v1 (manual payment model)
  7. Plan definitions edited by Admin affect
     new subscriptions only — existing active
     subscriptions keep their current plan terms
  8. Admin can see all data across all cafés
     but cannot place orders or edit menus
     (read + account management only)

─────────────────────────────────────────────

STATUSES:
  Café Account:    Active | Suspended
  Subscription:   Pending | Active | Expired | Cancelled
  Impersonation:  Active | Ended (logged)

─────────────────────────────────────────────

EDGE CASES:
  - Admin sets expiry date in the past accidentally:
      → validation blocks past dates, must be
        today or future
  - Admin tries to activate suspended café:
      → must reactivate account first, then
        set subscription
  - Admin impersonates while owner is also logged in:
      → both sessions exist independently,
        no conflict (JWT-based)
  - Admin searches for non-existent café:
      → empty state "No cafés found" — not an error
  - Admin suspends café with active live orders:
      → current active orders complete normally,
        new orders and logins blocked immediately

─────────────────────────────────────────────

VALIDATION RULES:
  subscription expiry:  must be today or future date
  plan:                 enum [basic, pro]
  suspension reason:    optional, max 200 chars
  impersonation:        logged automatically,
                        no manual input needed
  search:               min 2 chars to trigger search


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 5: Smart Chunking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHUNK PLAN: All Modules
========================
Each chunk = one responsibility only.
Sequenced so every chunk builds on the previous.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 1 — Auth & Subscription
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chunk 1.1 — Database schema: users, cafes,
            subscriptions, plans tables
Chunk 1.2 — Seed Super Admin account + seed
            Basic/Pro plan definitions
Chunk 1.3 — Café Owner registration API
            (POST /auth/register) + email
            verification token generation
Chunk 1.4 — Email verification endpoint
            (GET /auth/verify/:token)
Chunk 1.5 — Login API (POST /auth/login)
            → JWT issued on success
Chunk 1.6 — Password reset request API
            (POST /auth/forgot-password)
Chunk 1.7 — Password reset confirm API
            (POST /auth/reset-password/:token)
Chunk 1.8 — JWT auth middleware + role guard
            middleware (owner / staff / admin)
Chunk 1.9 — Subscription activation API
            (Admin only: PATCH /admin/cafes/
            :id/subscription)
Chunk 1.10 — Feature gate middleware
             (checks active subscription before
             allowing access to Pro routes)
Chunk 1.11 — Registration page (UI)
Chunk 1.12 — Email verification waiting screen (UI)
Chunk 1.13 — Plan selection page (UI)
Chunk 1.14 — Login page (UI)
Chunk 1.15 — Password reset flow pages (UI)
Chunk 1.16 — Subscription expired banner +
             upgrade prompt (UI component)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 2 — Café Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chunk 2.1 — Database schema: cafe_profiles,
            operating_hours tables
Chunk 2.2 — Café profile create/update API
            (POST & PATCH /cafe/profile)
            + logo upload handling
Chunk 2.3 — Operating hours API
            (PUT /cafe/hours)
Chunk 2.4 — Open/Closed toggle API
            (PATCH /cafe/status)
Chunk 2.5 — QR code generation service
            (generates on café creation,
            returns /menu/{slug} URL as QR)
Chunk 2.6 — QR download endpoint
            (GET /cafe/qr/download?format=png|pdf)
Chunk 2.7 — Theme customization API
            (PATCH /cafe/theme)
Chunk 2.8 — Café profile setup page (UI)
Chunk 2.9 — Operating hours editor (UI component)
Chunk 2.10 — Open/Closed toggle widget (UI)
Chunk 2.11 — QR code display + download
             buttons (UI component)
Chunk 2.12 — Theme color picker (UI component)
Chunk 2.13 — Setup completion checklist (UI)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 3 — Menu Builder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chunk 3.1 — Database schema: categories, items,
            modifier_groups, modifier_options,
            dietary_tags tables
Chunk 3.2 — Category CRUD API
            (POST/PATCH/DELETE/GET /menu/categories)
Chunk 3.3 — Category reorder API
            (PATCH /menu/categories/reorder)
Chunk 3.4 — Menu item CRUD API
            (POST/PATCH/DELETE/GET /menu/items)
            + photo upload handling
Chunk 3.5 — Item availability toggle API
            (PATCH /menu/items/:id/availability)
Chunk 3.6 — Modifier group CRUD API
            (POST/PATCH/DELETE /menu/items/
            :id/modifiers)
Chunk 3.7 — Modifier options CRUD API
            (POST/PATCH/DELETE /menu/items/
            :id/modifiers/:groupId/options)
Chunk 3.8 — Dietary tags assign/remove API
            (PATCH /menu/items/:id/tags)
Chunk 3.9 — Menu publish/unpublish API
            (PATCH /menu/publish)
Chunk 3.10 — Menu builder main page (UI)
Chunk 3.11 — Category list + add/edit/delete (UI)
Chunk 3.12 — Drag-and-drop category reorder (UI)
Chunk 3.13 — Item card grid within category (UI)
Chunk 3.14 — Add/edit item form modal (UI)
             (name, desc, price, photo, tags)
Chunk 3.15 — Modifier group builder inside
             item form (UI component)
Chunk 3.16 — Item availability toggle on
             item card (UI)
Chunk 3.17 — Publish/unpublish menu button
             with confirmation (UI)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 4 — Customer Ordering
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chunk 4.1 — Database schema: orders,
            order_items, order_item_modifiers
            tables
Chunk 4.2 — Public menu fetch API
            (GET /menu/:slug) — returns full
            menu with categories, items,
            modifiers, café status
Chunk 4.3 — Place order API
            (POST /orders) — validates cart,
            creates order + items snapshot,
            emits WebSocket event
Chunk 4.4 — Order status fetch API
            (GET /orders/:orderToken) —
            public, no auth required
Chunk 4.5 — Session token generation service
            (UUID, 2hr expiry, stored in
            browser localStorage)
Chunk 4.6 — Public menu page shell (UI)
            (/menu/:slug route, mobile-optimized)
Chunk 4.7 — Café header component (UI)
            (logo, name, open/closed, hours)
Chunk 4.8 — Category sticky tab bar (UI)
Chunk 4.9 — Item card grid (UI)
            (photo, name, price, tags,
            sold-out state)
Chunk 4.10 — Item detail modal (UI)
             (modifiers, quantity picker,
             add to cart)
Chunk 4.11 — Cart drawer (UI)
             (items, quantities, subtotal,
             adjust/remove)
Chunk 4.12 — Checkout flow (UI)
             (order type, table number, note,
             order summary, place order button)
Chunk 4.13 — Order confirmation screen (UI)
             (order number, items, status)
Chunk 4.14 — Live order status tracker (UI)
             (WebSocket connection, real-time
             status updates on confirmation screen)
Chunk 4.15 — Closed café screen (UI)
Chunk 4.16 — Unavailable café screen (UI)
             (expired subscription)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 5 — Order Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chunk 5.1 — WebSocket server setup
            (connection handling, café room
            isolation, reconnection logic)
Chunk 5.2 — Order status update API
            (PATCH /orders/:id/status) —
            validates transition, emits
            WebSocket event to café room
            and customer token room
Chunk 5.3 — Cancel order API
            (PATCH /orders/:id/cancel) —
            owner only, requires reason
Chunk 5.4 — Order history API
            (GET /orders/history) —
            paginated, filterable by date,
            searchable by order number
Chunk 5.5 — Daily summary API
            (GET /orders/summary/today)
Chunk 5.6 — Live order queue page (UI)
            (staff + owner, WebSocket connected)
Chunk 5.7 — Order card component (UI)
            (number, type, table, items,
            time, status badge)
Chunk 5.8 — New order alert system (UI)
            (sound chime, tab badge, card
            animation on arrival)
Chunk 5.9 — Order detail modal (UI)
            (full breakdown, status buttons,
            cancel button for owner)
Chunk 5.10 — Status update buttons (UI)
             (forward-only transitions,
             role-aware visibility)
Chunk 5.11 — Cancel order modal (UI)
             (reason input, confirm)
Chunk 5.12 — Order queue filter tabs (UI)
             (All / New / Preparing / Ready)
Chunk 5.13 — Order history page (UI)
             (owner only, search, date filter,
             paginated list)
Chunk 5.14 — Daily summary bar (UI)
             (total orders + revenue today)
Chunk 5.15 — Connection lost banner +
             auto-reconnect handler (UI)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 6 — Analytics Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chunk 6.1 — KPI summary API
            (GET /analytics/summary?range=...)
            → today + month totals
Chunk 6.2 — Revenue + orders chart API
            (GET /analytics/daily?range=...)
            → daily aggregates for line/bar charts
Chunk 6.3 — Peak hours API
            (GET /analytics/peak-hours?range=...)
            → order count by hour × day of week
Chunk 6.4 — Best-selling items API
            (GET /analytics/top-items?range=...)
            → top 10 by quantity + revenue
Chunk 6.5 — Category performance API
            (GET /analytics/categories?range=...)
Chunk 6.6 — Order type split API
            (GET /analytics/order-types?range=...)
Chunk 6.7 — CSV export API
            (GET /analytics/export?range=...)
Chunk 6.8 — Analytics page shell + date
            range filter (UI)
Chunk 6.9 — KPI summary cards (UI component)
Chunk 6.10 — Revenue line chart (UI component)
Chunk 6.11 — Orders volume bar chart (UI component)
Chunk 6.12 — Peak hours heatmap (UI component)
Chunk 6.13 — Best-selling items ranked
             list (UI component)
Chunk 6.14 — Category performance
             breakdown (UI component)
Chunk 6.15 — Dine-in vs takeaway split
             chart (UI component)
Chunk 6.16 — CSV export button +
             download handler (UI)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 7 — Super Admin Panel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chunk 7.1 — Admin JWT guard middleware
            (separate from owner/staff guard)
Chunk 7.2 — Platform KPI API
            (GET /admin/stats) → total cafés,
            active subs, today's orders
Chunk 7.3 — Café list API
            (GET /admin/cafes) — paginated,
            searchable
Chunk 7.4 — Café detail API
            (GET /admin/cafes/:id) — full
            profile + subscription + order count
Chunk 7.5 — Subscription management API
            (PATCH /admin/cafes/:id/subscription)
Chunk 7.6 — Account suspend/reactivate API
            (PATCH /admin/cafes/:id/status)
Chunk 7.7 — Impersonation API
            (POST /admin/impersonate/:cafeId)
            → issues scoped owner JWT,
            logs session
Chunk 7.8 — Plan definitions CRUD API
            (POST/PATCH /admin/plans)
Chunk 7.9 — Admin login page (UI)
            (/admin/login — separate from
            owner login)
Chunk 7.10 — Admin dashboard + KPI cards (UI)
Chunk 7.11 — Café list page (UI)
             (search, status badges, pagination)
Chunk 7.12 — Café detail page (UI)
             (profile, subscription panel,
             action buttons)
Chunk 7.13 — Subscription management
             panel (UI component)
             (plan picker, expiry date setter,
             activate button)
Chunk 7.14 — Suspend/reactivate confirmation
             modal (UI)
Chunk 7.15 — Impersonation mode banner (UI)
             (red persistent banner, exit button)
Chunk 7.16 — Plan definitions management
             page (UI)




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 6: Database Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE ARCHITECTURE
======================
Database:     PostgreSQL
ORM:          Prisma
Primary Keys: UUID on all tables
Audit Fields: created_at, updated_at on all tables
Soft Delete:  deleted_at on: categories, items,
              modifier_groups, modifier_options, orders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENTITIES & KEY FIELDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

plans
─────
  id            UUID PK
  name          VARCHAR(50)       -- "Basic" / "Pro"
  price         DECIMAL(10,2)     -- display only (manual)
  features      JSONB             -- list of feature keys
  is_active     BOOLEAN DEFAULT true
  created_at, updated_at

admin_users
───────────
  id            UUID PK
  email         VARCHAR(255) UNIQUE
  password_hash VARCHAR(255)
  created_at, updated_at

cafe_owners
───────────
  id            UUID PK
  email         VARCHAR(255) UNIQUE
  password_hash VARCHAR(255)
  full_name     VARCHAR(100)
  email_verified BOOLEAN DEFAULT false
  verify_token  VARCHAR(255) NULLABLE
  verify_token_expires_at TIMESTAMPTZ NULLABLE
  reset_token   VARCHAR(255) NULLABLE
  reset_token_expires_at  TIMESTAMPTZ NULLABLE
  status        ENUM(unverified, active, suspended)
                DEFAULT unverified
  created_at, updated_at

subscriptions
─────────────
  id            UUID PK
  cafe_owner_id UUID FK → cafe_owners.id
  plan_id       UUID FK → plans.id
  status        ENUM(pending, active, expired,
                cancelled) DEFAULT pending
  starts_at     TIMESTAMPTZ NULLABLE
  expires_at    TIMESTAMPTZ NULLABLE
  activated_by  UUID FK → admin_users.id NULLABLE
  notes         TEXT NULLABLE       -- admin notes
  created_at, updated_at

cafes
─────
  id            UUID PK
  owner_id      UUID FK → cafe_owners.id UNIQUE
  name          VARCHAR(60)
  slug          VARCHAR(80) UNIQUE
  description   VARCHAR(200) NULLABLE
  address       VARCHAR(120) NULLABLE
  phone         VARCHAR(30) NULLABLE
  logo_url      VARCHAR(500) NULLABLE
  primary_color VARCHAR(7) DEFAULT '#000000'
  bg_color      VARCHAR(7) DEFAULT '#ffffff'
  status        ENUM(open, closed) DEFAULT closed
  profile_complete BOOLEAN DEFAULT false
  created_at, updated_at

operating_hours
───────────────
  id            UUID PK
  cafe_id       UUID FK → cafes.id
  day_of_week   SMALLINT         -- 0=Mon … 6=Sun
  is_closed     BOOLEAN DEFAULT false
  open_time     TIME NULLABLE
  close_time    TIME NULLABLE
  created_at, updated_at

  UNIQUE(cafe_id, day_of_week)

cafe_staff
──────────
  id            UUID PK
  cafe_id       UUID FK → cafes.id
  email         VARCHAR(255)
  password_hash VARCHAR(255)
  full_name     VARCHAR(100)
  status        ENUM(active, suspended)
                DEFAULT active
  created_at, updated_at

  UNIQUE(cafe_id, email)

menus
─────
  id            UUID PK
  cafe_id       UUID FK → cafes.id UNIQUE
  status        ENUM(draft, published, unpublished)
                DEFAULT draft
  published_at  TIMESTAMPTZ NULLABLE
  created_at, updated_at

categories
──────────
  id            UUID PK
  menu_id       UUID FK → menus.id
  cafe_id       UUID FK → cafes.id  -- denormalized
                                     -- for fast queries
  name          VARCHAR(50)
  sort_order    SMALLINT DEFAULT 0
  deleted_at    TIMESTAMPTZ NULLABLE
  created_at, updated_at

items
─────
  id            UUID PK
  category_id   UUID FK → categories.id
  cafe_id       UUID FK → cafes.id  -- denormalized
  name          VARCHAR(80)
  description   VARCHAR(300) NULLABLE
  base_price    DECIMAL(10,2)
  photo_url     VARCHAR(500) NULLABLE
  availability  ENUM(available, sold_out)
                DEFAULT available
  sort_order    SMALLINT DEFAULT 0
  deleted_at    TIMESTAMPTZ NULLABLE
  created_at, updated_at

dietary_tags
────────────
  id            UUID PK
  name          VARCHAR(30) UNIQUE
  -- seeded: vegan, vegetarian, gluten-free,
  --         nuts, dairy, spicy

item_dietary_tags
─────────────────
  item_id       UUID FK → items.id
  tag_id        UUID FK → dietary_tags.id
  PRIMARY KEY (item_id, tag_id)

modifier_groups
───────────────
  id            UUID PK
  item_id       UUID FK → items.id
  cafe_id       UUID FK → cafes.id  -- denormalized
  name          VARCHAR(50)
  is_required   BOOLEAN DEFAULT false
  is_multi      BOOLEAN DEFAULT false
                -- false = single-select
                -- true  = multi-select
  sort_order    SMALLINT DEFAULT 0
  deleted_at    TIMESTAMPTZ NULLABLE
  created_at, updated_at

modifier_options
────────────────
  id            UUID PK
  group_id      UUID FK → modifier_groups.id
  name          VARCHAR(50)
  price_adj     DECIMAL(10,2) DEFAULT 0.00
  sort_order    SMALLINT DEFAULT 0
  deleted_at    TIMESTAMPTZ NULLABLE
  created_at, updated_at

orders
──────
  id              UUID PK
  cafe_id         UUID FK → cafes.id
  order_token     UUID UNIQUE      -- customer tracking
  daily_number    SMALLINT         -- resets daily per café
  order_date      DATE             -- for daily_number scope
  type            ENUM(dine_in, takeaway)
  table_number    SMALLINT NULLABLE
  note            VARCHAR(200) NULLABLE
  status          ENUM(new, preparing, ready,
                  served, cancelled) DEFAULT new
  total_amount    DECIMAL(10,2)    -- snapshot at order time
  cancel_reason   VARCHAR(200) NULLABLE
  cancelled_by    UUID NULLABLE    -- owner id
  deleted_at      TIMESTAMPTZ NULLABLE
  created_at, updated_at

  UNIQUE(cafe_id, daily_number, order_date)
  INDEX(cafe_id, created_at)
  INDEX(order_token)

order_items
───────────
  id            UUID PK
  order_id      UUID FK → orders.id
  item_id       UUID FK → items.id  -- reference only
  item_name     VARCHAR(80)         -- snapshot
  base_price    DECIMAL(10,2)       -- snapshot
  quantity      SMALLINT
  subtotal      DECIMAL(10,2)       -- snapshot
  created_at, updated_at

order_item_modifiers
────────────────────
  id              UUID PK
  order_item_id   UUID FK → order_items.id
  group_name      VARCHAR(50)   -- snapshot
  option_name     VARCHAR(50)   -- snapshot
  price_adj       DECIMAL(10,2) -- snapshot
  created_at, updated_at

impersonation_logs
──────────────────
  id            UUID PK
  admin_id      UUID FK → admin_users.id
  cafe_id       UUID FK → cafes.id
  started_at    TIMESTAMPTZ DEFAULT now()
  ended_at      TIMESTAMPTZ NULLABLE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RELATIONSHIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cafe_owners     ||--|| subscriptions       : has one
cafe_owners     ||--|| cafes               : owns one
cafes           ||--|{ operating_hours     : has 7 rows
cafes           ||--|{ cafe_staff          : has many
cafes           ||--|| menus               : has one
menus           ||--|{ categories          : has many
categories      ||--|{ items               : has many
items           ||--|{ modifier_groups     : has many
modifier_groups ||--|{ modifier_options    : has many
items           }|--|{ dietary_tags        : many-to-many
                      via item_dietary_tags
cafes           ||--|{ orders              : has many
orders          ||--|{ order_items         : has many
order_items     ||--|{ order_item_modifiers: has many
admin_users     ||--|{ impersonation_logs  : has many
cafes           ||--|{ impersonation_logs  : has many

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDEXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cafe_owners:      email (unique)
cafes:            slug (unique), owner_id (unique)
operating_hours:  (cafe_id, day_of_week) unique
cafe_staff:       (cafe_id, email) unique
categories:       (menu_id, sort_order)
items:            (category_id, sort_order),
                  (cafe_id, availability)
orders:           (cafe_id, created_at),
                  (order_token) unique,
                  (cafe_id, daily_number, order_date)
subscriptions:    (cafe_owner_id), (status)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTRAINTS & RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. items.base_price         CHECK (base_price > 0)
  2. modifier_options.price_adj CHECK (price_adj >= 0)
  3. orders.total_amount      CHECK (total_amount >= 0)
  4. order_items.quantity     CHECK (quantity > 0)
  5. operating_hours: when is_closed = false,
     open_time and close_time must not be null
  6. orders.table_number required when type = dine_in
     (enforced at application layer)
  7. subscriptions: one active subscription per
     cafe_owner at a time (enforced at app layer)
  8. daily_number scoped to (cafe_id + order_date)
     — generated at order creation time

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOFT DELETE STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tables with soft delete (deleted_at):
    categories, items, modifier_groups,
    modifier_options, orders

  All queries on these tables must include:
    WHERE deleted_at IS NULL
  (enforced via Prisma middleware or
   global query extension)

  Order items and modifiers are NEVER deleted —
  they are permanent snapshots of order history.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 7: API Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API CONTRACT: CaféOS — All Modules
====================================
Auth Strategy:  JWT Bearer Token
                (except public /menu routes)
Response Format:
  Success: { "success": true, "data": {...},
             "message": "..." }
  Error:   { "success": false, "error": "...",
             "code": 400 }

Route Prefixes:
  /api/auth        → Auth & Subscription
  /api/cafe        → Café Management (owner)
  /api/menu        → Menu Builder (owner)
  /api/public      → Customer Ordering (no auth)
  /api/orders      → Order Management (staff/owner)
  /api/analytics   → Analytics (owner only)
  /api/admin       → Super Admin Panel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 1 — Auth & Subscription
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POST /api/auth/register
  Auth:     None
  Request:  { full_name, email, password, cafe_name }
  Response: { data: { owner_id, email } }
  Errors:   409 email already exists
            422 validation failed

GET /api/auth/verify/:token
  Auth:     None
  Request:  token in URL param
  Response: { data: { verified: true } }
  Errors:   400 invalid or expired token

POST /api/auth/login
  Auth:     None
  Request:  { email, password }
  Response: { data: { access_token, owner: {
             id, email, full_name,
             cafe_id, subscription_status } } }
  Errors:   401 invalid credentials
            403 email not verified
            403 account suspended

POST /api/auth/forgot-password
  Auth:     None
  Request:  { email }
  Response: { message: "Reset link sent if
              email exists" }
  Errors:   422 validation failed
  Note:     always returns 200 (no email
            enumeration)

POST /api/auth/reset-password/:token
  Auth:     None
  Request:  { password }
  Response: { message: "Password updated" }
  Errors:   400 invalid or expired token
            422 validation failed

POST /api/auth/resend-verification
  Auth:     None
  Request:  { email }
  Response: { message: "Verification sent
              if account exists" }
  Errors:   400 already verified

GET /api/auth/me
  Auth:     Owner JWT
  Response: { data: { owner, cafe,
              subscription } }
  Errors:   401 unauthorized

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 2 — Café Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/cafe/profile
  Auth:     Owner JWT
  Response: { data: { cafe profile object } }
  Errors:   404 cafe not found

PATCH /api/cafe/profile
  Auth:     Owner JWT
  Request:  { name?, description?, address?,
              phone? } (multipart for logo)
  Response: { data: { updated cafe } }
  Errors:   422 validation failed
            413 logo too large

PATCH /api/cafe/theme
  Auth:     Owner JWT
  Request:  { primary_color, bg_color }
  Response: { data: { primary_color, bg_color } }
  Errors:   422 invalid hex color

PATCH /api/cafe/status
  Auth:     Owner JWT
  Request:  { status: "open" | "closed" }
  Response: { data: { status } }
  Errors:   422 invalid status

PUT /api/cafe/hours
  Auth:     Owner JWT
  Request:  { hours: [ { day_of_week, is_closed,
              open_time?, close_time? } ] }
  Response: { data: { hours: [...] } }
  Errors:   422 open_time >= close_time
            422 missing times when not closed

GET /api/cafe/qr
  Auth:     Owner JWT
  Response: { data: { qr_url, menu_url,
              slug } }

GET /api/cafe/qr/download
  Auth:     Owner JWT
  Query:    ?format=png|pdf
  Response: File download (binary)
  Errors:   400 invalid format

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 3 — Menu Builder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/menu
  Auth:     Owner JWT
  Response: { data: { menu status, categories
              with items + modifiers } }

PATCH /api/menu/publish
  Auth:     Owner JWT
  Request:  { status: "published"|"unpublished" }
  Response: { data: { status } }
  Errors:   400 no items exist (cannot publish)

--- Categories ---

POST /api/menu/categories
  Auth:     Owner JWT
  Request:  { name }
  Response: { data: { category } }
  Errors:   422 validation failed

PATCH /api/menu/categories/:id
  Auth:     Owner JWT
  Request:  { name? }
  Response: { data: { category } }
  Errors:   404 not found
            403 not owner's category

DELETE /api/menu/categories/:id
  Auth:     Owner JWT
  Response: { message: "Category and all
              items deleted" }
  Errors:   404 not found
            403 not owner's category

PATCH /api/menu/categories/reorder
  Auth:     Owner JWT
  Request:  { order: [ { id, sort_order } ] }
  Response: { message: "Reordered" }
  Errors:   422 validation failed

--- Items ---

POST /api/menu/items
  Auth:     Owner JWT
  Request:  { category_id, name, description?,
              base_price, dietary_tag_ids? }
              (multipart for photo)
  Response: { data: { item } }
  Errors:   422 validation failed
            404 category not found
            413 photo too large

PATCH /api/menu/items/:id
  Auth:     Owner JWT
  Request:  { name?, description?, base_price?,
              category_id?, dietary_tag_ids? }
              (multipart for photo)
  Response: { data: { item } }
  Errors:   404 not found
            403 not owner's item

DELETE /api/menu/items/:id
  Auth:     Owner JWT
  Response: { message: "Item deleted" }
  Errors:   404 not found

PATCH /api/menu/items/:id/availability
  Auth:     Owner JWT
  Request:  { availability: "available"|
              "sold_out" }
  Response: { data: { availability } }
  Errors:   404 not found

--- Modifier Groups ---

POST /api/menu/items/:id/modifiers
  Auth:     Owner JWT
  Request:  { name, is_required, is_multi }
  Response: { data: { modifier_group } }
  Errors:   422 validation failed
            404 item not found

PATCH /api/menu/items/:id/modifiers/:groupId
  Auth:     Owner JWT
  Request:  { name?, is_required?, is_multi? }
  Response: { data: { modifier_group } }
  Errors:   404 not found

DELETE /api/menu/items/:id/modifiers/:groupId
  Auth:     Owner JWT
  Response: { message: "Modifier group deleted" }
  Errors:   404 not found

--- Modifier Options ---

POST /api/menu/modifiers/:groupId/options
  Auth:     Owner JWT
  Request:  { name, price_adj }
  Response: { data: { option } }
  Errors:   422 validation failed
            422 price_adj < 0

PATCH /api/menu/modifiers/:groupId/options/:id
  Auth:     Owner JWT
  Request:  { name?, price_adj? }
  Response: { data: { option } }
  Errors:   404 not found

DELETE /api/menu/modifiers/:groupId/options/:id
  Auth:     Owner JWT
  Response: { message: "Option deleted" }
  Errors:   400 cannot delete — group would
            have fewer than 2 options

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 4 — Customer Ordering
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/public/menu/:slug
  Auth:     None
  Response: { data: { cafe: { name, logo,
              status, hours, theme },
              menu: { categories, items,
              modifiers, tags } } }
  Errors:   404 café not found
            403 menu not published
            402 subscription expired /
                inactive (café unavailable)

POST /api/public/orders
  Auth:     None (session token in header
            X-Session-Token)
  Request:  { cafe_id, type, table_number?,
              note?, items: [ { item_id,
              quantity, selected_modifiers:
              [ { group_id, option_ids: [] }
              ] } ] }
  Response: { data: { order_token,
              daily_number, total_amount,
              status, items } }
  Errors:   400 café is closed
            402 subscription expired
            404 item not found / deleted
            409 item is sold out
            422 required modifier not selected
            422 validation failed

GET /api/public/orders/:orderToken
  Auth:     None
  Response: { data: { daily_number, status,
              type, table_number, items,
              total_amount, created_at } }
  Errors:   404 order not found

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 5 — Order Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/orders/live
  Auth:     Owner or Staff JWT
  Response: { data: { orders: [ active
              orders — New/Preparing/Ready ] } }

PATCH /api/orders/:id/status
  Auth:     Owner or Staff JWT
  Request:  { status: "preparing"|"ready"|
              "served" }
  Response: { data: { id, status } }
  Errors:   400 invalid transition
            403 not this café's order
            404 not found

PATCH /api/orders/:id/cancel
  Auth:     Owner JWT only
  Request:  { cancel_reason }
  Response: { data: { id, status:
              "cancelled" } }
  Errors:   400 cannot cancel served order
            403 staff cannot cancel
            404 not found
            422 cancel_reason too short

GET /api/orders/history
  Auth:     Owner JWT only
  Query:    ?page=1&limit=20&start=&end=
            &order_number=
  Response: { data: { orders: [...],
              total, page, pages } }
  Errors:   403 staff not allowed
            422 invalid date range

GET /api/orders/summary/today
  Auth:     Owner or Staff JWT
  Response: { data: { total_orders,
              total_revenue,
              orders_by_status } }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 6 — Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All analytics endpoints:
  Auth:   Owner JWT only
  Query:  ?range=today|7days|30days|
          this_month|custom
          &start=YYYY-MM-DD (custom only)
          &end=YYYY-MM-DD (custom only)
  Errors: 403 staff not allowed
          422 range > 90 days
          422 future dates
          422 end < start

GET /api/analytics/summary
  Response: { data: { today_revenue,
              today_orders, month_revenue,
              month_orders } }

GET /api/analytics/daily
  Response: { data: { days: [ { date,
              revenue, orders } ] } }

GET /api/analytics/peak-hours
  Response: { data: { grid: [ { day,
              hour, count } ] } }

GET /api/analytics/top-items
  Response: { data: { items: [ { item_id,
              name, qty, revenue } ] } }

GET /api/analytics/categories
  Response: { data: { categories: [ {
              category_id, name, revenue,
              orders } ] } }

GET /api/analytics/order-types
  Response: { data: { dine_in: { count,
              pct }, takeaway: { count,
              pct } } }

GET /api/analytics/export
  Auth:     Owner JWT
  Query:    same range params
  Response: CSV file download
  Errors:   422 range validation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 7 — Super Admin Panel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POST /api/admin/auth/login
  Auth:     None
  Request:  { email, password }
  Response: { data: { access_token,
              admin: { id, email } } }
  Errors:   401 invalid credentials

GET /api/admin/stats
  Auth:     Admin JWT
  Response: { data: { total_cafes,
              active_subscriptions,
              today_orders,
              today_revenue } }

GET /api/admin/cafes
  Auth:     Admin JWT
  Query:    ?page=1&limit=20&search=
            &status=active|suspended
  Response: { data: { cafes: [...],
              total, page, pages } }

GET /api/admin/cafes/:id
  Auth:     Admin JWT
  Response: { data: { cafe, owner,
              subscription, order_count,
              staff_count } }
  Errors:   404 not found

PATCH /api/admin/cafes/:id/subscription
  Auth:     Admin JWT
  Request:  { plan_id, status, starts_at,
              expires_at, notes? }
  Response: { data: { subscription } }
  Errors:   422 expires_at in the past
            422 validation failed

PATCH /api/admin/cafes/:id/account
  Auth:     Admin JWT
  Request:  { status: "active"|"suspended" }
  Response: { data: { owner_status } }
  Errors:   422 validation failed

POST /api/admin/impersonate/:cafeId
  Auth:     Admin JWT
  Response: { data: { impersonation_token,
              cafe_id, owner_id } }
  Errors:   404 café not found
            400 café account suspended

DELETE /api/admin/impersonate
  Auth:     Impersonation JWT
  Response: { message: "Session ended" }
  Note:     Logs ended_at on impersonation_logs

GET /api/admin/plans
  Auth:     Admin JWT
  Response: { data: { plans: [...] } }

POST /api/admin/plans
  Auth:     Admin JWT
  Request:  { name, price, features }
  Response: { data: { plan } }
  Errors:   422 validation failed

PATCH /api/admin/plans/:id
  Auth:     Admin JWT
  Request:  { name?, price?, features?,
              is_active? }
  Response: { data: { plan } }
  Errors:   404 not found


  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 SPEC BLOCK — Phase 8: Frontend Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONTEND ARCHITECTURE
======================
Framework:        React + TanStack Router
Data Fetching:    TanStack Query (React Query)
Styling:          Tailwind CSS
State:            TanStack Query for server state
                  Zustand for client state
                  (cart, session token, UI state)
Forms:            React Hook Form + Zod
Real-time:        Socket.io client
File Uploads:     Axios multipart
Icons:            Lucide React
Charts:           Recharts
Toast/Alerts:     Sonner

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APP STRUCTURE — 3 SEPARATE PORTALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Customer Portal     /menu/:slug (public)
2. Owner/Staff Portal  /dashboard (protected)
3. Admin Portal        /admin (protected)

All three live in one React app,
separated by route trees and layouts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTING STRUCTURE (TanStack Router)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PUBLIC ROUTES (no auth)
────────────────────────
/                         → Landing / redirect
/login                    → Owner login page
/register                 → Owner registration
/verify-email             → Email verification
                            waiting screen
/verify/:token            → Auto-verify redirect
/forgot-password          → Request reset page
/reset-password/:token    → Set new password
/menu/:slug               → Customer menu page
/menu/:slug/order/:token  → Order confirmation
                            + status tracker
/menu/:slug/closed        → Café closed screen
/menu/:slug/unavailable   → Subscription expired

OWNER/STAFF ROUTES (JWT protected)
────────────────────────────────────
/dashboard                → Redirect to
                            appropriate home
/dashboard/setup          → First-time setup
                            checklist (owner)

-- Owner only --
/dashboard/home           → Overview + today
                            summary cards
/dashboard/menu           → Menu builder main
/dashboard/menu/categories→ Category management
/dashboard/menu/items/:id → Item edit page
/dashboard/analytics      → Analytics dashboard
/dashboard/settings       → Café profile + theme
/dashboard/settings/hours → Operating hours
/dashboard/settings/staff → Staff management
/dashboard/settings/plan  → Subscription status
/dashboard/qr             → QR code page

-- Owner + Staff --
/dashboard/orders         → Live order queue
/dashboard/orders/history → Order history
                            (owner only, redirect
                            staff away)

ADMIN ROUTES (Admin JWT protected)
────────────────────────────────────
/admin                    → Redirect to dashboard
/admin/login              → Admin login
/admin/dashboard          → Platform KPIs
/admin/cafes              → Café list
/admin/cafes/:id          → Café detail +
                            subscription panel
/admin/plans              → Plan management

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CustomerLayout
  → Minimal, mobile-first, no nav
  → Café theme colors injected as
    CSS variables from API response
  → Used by: /menu/* routes

AuthLayout
  → Centered card, no sidebar
  → Used by: /login, /register,
    /forgot-password, /reset-password,
    /verify-email

DashboardLayout (Owner/Staff)
  → Sidebar (desktop) + bottom nav (mobile)
  → Header: café name, open/closed toggle,
    notification bell, user menu
  → Sidebar links filtered by role
    (staff sees only Orders)
  → Subscription expired banner if applicable
  → Used by: /dashboard/* routes

AdminLayout
  → Sidebar + header
  → Impersonation mode banner
    (red, full-width, persistent)
  → Used by: /admin/* routes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGES — CUSTOMER PORTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MenuPage (/menu/:slug)
  Data:       GET /api/public/menu/:slug
  Components: CafeHeader, CategoryTabBar,
              ItemGrid, ItemCard,
              ItemDetailModal, CartDrawer,
              CartButton (floating)
  State:      cartStore (Zustand)
  Real-time:  none

CheckoutPage (inside CartDrawer flow)
  Components: OrderTypeSelector,
              TableNumberInput,
              OrderNoteInput,
              OrderSummary,
              PlaceOrderButton
  State:      cartStore
  API call:   POST /api/public/orders

OrderConfirmationPage
  (/menu/:slug/order/:token)
  Data:       GET /api/public/orders/:token
  Components: OrderStatusTracker,
              OrderItemsList,
              OrderTotals
  Real-time:  Socket.io (order:{token} room)
              → auto-updates status live

CafeClosedPage (/menu/:slug/closed)
  Components: CafeHeader (minimal),
              ClosedMessage, NextOpenTime

CafeUnavailablePage (/menu/:slug/unavailable)
  Components: UnavailableMessage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGES — AUTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RegisterPage
  Form:       full_name, email, cafe_name,
              password, confirm_password
  API:        POST /api/auth/register
  On success: redirect to /verify-email

VerifyEmailPage
  Components: VerificationPending,
              ResendButton
  API:        POST /api/auth/resend-verification

LoginPage
  Form:       email, password
  API:        POST /api/auth/login
  On success: redirect to /dashboard
  Handles:    suspended + unverified states

ForgotPasswordPage
  Form:       email
  API:        POST /api/auth/forgot-password

ResetPasswordPage
  Form:       password, confirm_password
  API:        POST /api/auth/reset-password/:token

PlanSelectionPage
  Components: PlanCard (Basic), PlanCard (Pro)
  API:        read-only display (activation
              done by admin)
  Note:       shown after registration,
              explains what each plan includes
              and that activation is manual

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGES — OWNER DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SetupChecklistPage (/dashboard/setup)
  Components: ChecklistStep (profile,
              hours, menu, publish, qr)
  Logic:      redirects away when all
              steps complete

HomePage (/dashboard/home)
  Data:       GET /api/orders/summary/today
  Components: KpiCard x4, RecentOrdersList,
              OpenClosedToggle (quick action),
              SetupBanner (if incomplete)

MenuBuilderPage (/dashboard/menu)
  Data:       GET /api/menu
  Components: CategoryList, CategoryCard,
              AddCategoryButton,
              DragDropProvider,
              PublishMenuToggle
  State:      local optimistic updates

ItemEditPage (/dashboard/menu/items/:id)
  Data:       GET /api/menu/items/:id
  Components: ItemForm, PhotoUploader,
              ModifierGroupBuilder,
              DietaryTagSelector,
              AvailabilityToggle

AnalyticsPage (/dashboard/analytics)
  Data:       all /api/analytics/* endpoints
  Components: DateRangePicker,
              KpiSummaryCards,
              RevenueLineChart,
              OrdersBarChart,
              PeakHoursHeatmap,
              TopItemsList,
              CategoryBreakdown,
              OrderTypeSplitChart,
              ExportButton

CafeSettingsPage (/dashboard/settings)
  Data:       GET /api/cafe/profile
  Components: CafeProfileForm,
              LogoUploader,
              ThemeColorPicker

OperatingHoursPage (/dashboard/settings/hours)
  Data:       GET /api/cafe/hours
  Components: HoursEditorGrid
              (7 rows, one per day)

StaffManagementPage (/dashboard/settings/staff)
  Data:       GET /api/cafe/staff
  Components: StaffList, AddStaffModal,
              StaffCard, SuspendButton

SubscriptionPage (/dashboard/settings/plan)
  Data:       GET /api/auth/me
  Components: CurrentPlanCard,
              PlanFeaturesTable,
              ExpiryCountdown,
              ContactAdminPrompt

QRCodePage (/dashboard/qr)
  Data:       GET /api/cafe/qr
  Components: QRCodeDisplay,
              DownloadPngButton,
              DownloadPdfButton,
              MenuUrlCopyButton

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGES — ORDER MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LiveOrderQueuePage (/dashboard/orders)
  Data:       GET /api/orders/live
  Real-time:  Socket.io (cafe:{cafeId} room)
  Components: DailySummaryBar,
              OrderFilterTabs,
              OrderQueueGrid,
              OrderCard,
              OrderDetailModal,
              NewOrderAlert (sound + badge),
              ConnectionStatusBanner

OrderHistoryPage (/dashboard/orders/history)
  Auth guard: owner only
  Data:       GET /api/orders/history
  Components: DateRangeFilter,
              OrderNumberSearch,
              OrderHistoryTable,
              OrderDetailModal (read-only)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGES — ADMIN PORTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AdminLoginPage (/admin/login)
  Form:       email, password
  API:        POST /api/admin/auth/login

AdminDashboardPage (/admin/dashboard)
  Data:       GET /api/admin/stats
  Components: PlatformKpiCards

CafeListPage (/admin/cafes)
  Data:       GET /api/admin/cafes
  Components: CafeSearchBar,
              CafeStatusFilter,
              CafeTable, Pagination

CafeDetailPage (/admin/cafes/:id)
  Data:       GET /api/admin/cafes/:id
  Components: CafeProfileCard,
              OwnerInfoCard,
              SubscriptionPanel,
              AccountStatusPanel,
              ImpersonateButton,
              OrderStatsCard

PlanManagementPage (/admin/plans)
  Data:       GET /api/admin/plans
  Components: PlanList, PlanCard,
              AddPlanModal, EditPlanModal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHARED COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UI Primitives (build or use shadcn/ui):
  Button, Input, Select, Checkbox,
  Modal/Dialog, Drawer, Tabs, Badge,
  Tooltip, Skeleton, Spinner,
  Toast (Sonner), DropdownMenu,
  DatePicker, ColorPicker

Domain Components (custom):
  KpiCard           → metric + label + trend
  OrderCard         → order summary card
  OrderDetailModal  → full order breakdown
  OrderStatusBadge  → colored status pill
  ItemCard          → menu item display
  ItemDetailModal   → item + modifiers
  ModifierGroup     → modifier selector UI
  CartDrawer        → sliding cart panel
  CategoryTabBar    → sticky scrollable tabs
  PhotoUploader     → drag-drop + preview
  QRCodeDisplay     → QR image + actions
  SubscriptionBadge → plan + expiry status
  ConnectionBanner  → WebSocket status bar
  EmptyState        → icon + message + action
  ConfirmModal      → reusable confirm dialog
  PageHeader        → title + breadcrumb
  RoleGuard         → wraps routes by role

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATE MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TanStack Query (server state):
  → all API data fetching + caching
  → optimistic updates on availability
    toggle, status updates
  → invalidation strategy per mutation

Zustand stores (client state):

  cartStore:
    items[], addItem, removeItem,
    updateQty, clearCart,
    total (computed)
    persisted to localStorage

  sessionStore:
    session_token (UUID),
    generated on first visit,
    stored in localStorage,
    expires after 2hrs

  authStore:
    owner/staff/admin JWT,
    user object, role,
    stored in localStorage,
    cleared on logout

  socketStore:
    socket instance,
    connected status,
    current café room

  uiStore:
    sidebarOpen,
    activeOrderAlert count,
    sound enabled toggle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOM HOOKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useMenu(slug)
  → fetches public menu, handles
    closed/unavailable states

useCart()
  → cartStore wrapper with
    add/remove/total helpers

useOrders()
  → live queue + TanStack Query
    + Socket.io updates combined

useOrderStatus(token)
  → customer order tracker,
    Socket.io + polling fallback

useAnalytics(range)
  → fetches all analytics endpoints
    in parallel (Promise.all via
    TanStack Query)

useSocket(cafeId)
  → manages Socket.io connection,
    room join/leave, reconnect

useSoundAlert()
  → plays chime on new order,
    respects sound enabled toggle

useSubscriptionGate()
  → reads auth state, returns
    isPro, isExpired, daysLeft

useImpersonation()
  → detects impersonation token,
    shows banner, handles exit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT TREE (simplified)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App (TanStack Router root)
├── CustomerLayout
│   ├── MenuPage
│   │   ├── CafeHeader
│   │   ├── CategoryTabBar
│   │   ├── ItemGrid → ItemCard[]
│   │   ├── ItemDetailModal
│   │   └── CartDrawer → CheckoutFlow
│   └── OrderConfirmationPage
│       └── OrderStatusTracker
├── AuthLayout
│   ├── LoginPage
│   ├── RegisterPage
│   └── ...auth pages
├── DashboardLayout
│   ├── Sidebar (role-filtered links)
│   ├── Header (toggle, alerts, user)
│   ├── SubscriptionExpiredBanner?
│   └── Pages/
│       ├── HomePage
│       ├── MenuBuilderPage
│       ├── LiveOrderQueuePage
│       ├── AnalyticsPage
│       └── ...settings pages
└── AdminLayout
    ├── ImpersonationBanner?
    ├── Sidebar
    └── Pages/
        ├── AdminDashboardPage
        ├── CafeListPage
        ├── CafeDetailPage
        └── PlanManagementPage

        
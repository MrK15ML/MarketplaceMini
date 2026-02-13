# UX Engineer Agent — Handshake Marketplace

## Role
Review and improve UI components, page layouts, user flows, and frontend patterns. Ensure clarity, mobile responsiveness, conversion optimization, and consistent design language.

## Design System

### Component Library
- **Base**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Icons**: lucide-react
- **Styling**: Tailwind CSS v4 with tw-animate-css
- **Toasts**: sonner
- **Forms**: React Hook Form + Zod v4

### Installed shadcn/ui Components
avatar, badge, button, card, dialog, dropdown-menu, form, input, label, select, separator, sheet, skeleton, sonner, table, tabs, textarea

### Color Palette
- Primary: dark (oklch 0.205) with light foreground
- Destructive: red (oklch 0.577)
- Muted: light gray (oklch 0.97)
- Status colors: yellow (pending), blue (clarifying), purple (offered), green (accepted), indigo (in_progress), emerald (completed), teal (reviewed), gray (cancelled), red (declined)

### Typography
- Font: Geist Sans (sans) / Geist Mono (mono)
- Headings: text-2xl font-bold for page titles
- Body: text-sm for most content
- Micro: text-xs for metadata, timestamps

### Layout Patterns
- Navbar: sticky top-0, z-50, backdrop-blur
- Platform pages: Navbar + Sidebar + Main content area
- Cards: standard shadcn Card with CardHeader/CardContent
- Max width: max-w-4xl for detail pages, max-w-2xl for forms
- Grid: lg:grid-cols-3 for detail pages (2/3 content + 1/3 sidebar)

## Key User Flows

### Buyer Flow
1. Landing → Browse Services → Listing Detail → Request Service
2. Jobs List → Job Detail → Chat → Review Offer → Accept → Track Progress → Review

### Seller Flow
1. Settings (enable seller mode) → Create Listing
2. Jobs List (Incoming) → Job Detail → Chat → Send Offer → Start Work → Complete → Review

### Critical Conversion Points
- Listing card → Listing detail (click-through)
- Listing detail → Request Service (form submit)
- Offer received → Accept (decision point)
- Job complete → Leave review (engagement)

## Mobile Considerations
- No native app yet — web must work perfectly on mobile
- Chat input should be sticky at bottom
- Action buttons should be reachable with thumb
- Cards should stack vertically on mobile
- Timeline should be scrollable horizontally on small screens
- Tabs should be full-width on mobile

## Current Components (recently upgraded)
- **Job Timeline**: Horizontal step indicator (7 steps + terminal states)
- **Message Bubbles**: Grouped by sender (2min window), hover timestamps, fade-in animation
- **Typing Indicator**: Bouncing dots with user name
- **Unread Badges**: Navbar + job list + chat tab
- **Seller Trust Card**: Score, tier, rating, deals, response time
- **Empty States**: Role-specific onboarding hints in chat and offers

## Review Checklist
1. Mobile-first: does it work on 375px width?
2. Loading states: is there a skeleton or spinner?
3. Empty states: is there a helpful message?
4. Error states: does the user know what went wrong?
5. CTAs: are primary actions visually prominent?
6. Accessibility: proper contrast, focus states, aria labels?
7. Consistency: does it match existing component patterns?
8. Performance: any unnecessary re-renders or heavy components?

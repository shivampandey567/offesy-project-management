officemate/
├── app/                          # App Router (pages & layouts)
│   ├── (marketing)/              # Route group — public-facing pages
│   │   ├── page.tsx              # Homepage
│   │   ├── about/page.tsx
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx            # Marketing layout (navbar, footer)
│   ├── (dashboard)/              # Route group — authenticated app
│   │   ├── dashboard/page.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx          # All bookings
│   │   │   └── [id]/page.tsx     # Single booking
│   │   ├── spaces/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── members/page.tsx
│   │   └── layout.tsx            # Dashboard layout (sidebar, topbar)
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── bookings/route.ts
│   │   └── spaces/route.ts
│   ├── layout.tsx                # Root layout
│   ├── not-found.tsx
│   └── globals.css
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Base design system (shadcn/radix)
│   │   ├── button.tsx
│   │   ├── modal.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── layout/                   # Structural components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── DashboardTopbar.tsx
│   ├── marketing/                # Landing page sections
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── PricingSection.tsx
│   │   └── TestimonialsSection.tsx
│   └── dashboard/                # Dashboard-specific components
│       ├── BookingCard.tsx
│       ├── SpaceGrid.tsx
│       ├── OccupancyChart.tsx
│       └── MemberTable.tsx
│
├── lib/                          # Core utilities & logic
│   ├── db.ts                     # DB client (Prisma / Supabase)
│   ├── auth.ts                   # Auth config (NextAuth)
│   ├── utils.ts                  # General helpers (cn, formatDate, etc.)
│   └── validations.ts            # Zod schemas
│
├── hooks/                        # Custom React hooks
│   ├── useBookings.ts
│   ├── useSpaces.ts
│   └── useCurrentUser.ts
│
├── services/                     # API call functions (client-side fetchers)
│   ├── bookingService.ts
│   ├── spaceService.ts
│   └── memberService.ts
│
├── types/                        # TypeScript types & interfaces
│   ├── booking.ts
│   ├── space.ts
│   └── user.ts
│
├── store/                        # Global state (Zustand / Jotai)
│   ├── bookingStore.ts
│   └── uiStore.ts
│
├── constants/                    # App-wide constants
│   └── index.ts
│
├── public/                       # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── prisma/                       # DB schema (if using Prisma)
│   └── schema.prisma
│
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
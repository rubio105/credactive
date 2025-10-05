# CREDACTIVE ACADEMY - Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from premium professional education platforms (LinkedIn Learning, Coursera Professional) and enterprise SaaS products (Stripe, Linear) to establish credibility and sophistication. The design emphasizes trust, expertise, and premium positioning through refined visual hierarchy and strategic use of color.

**Core Principles**:
- Premium professional aesthetic that conveys expertise and authority
- Strategic gold accents for certification badges and premium features
- Clean, scannable layouts optimized for professional learners
- Subtle sophistication over flashy elements

## Color Palette

**Dark Mode Primary** (Main Interface):
- Background Base: 220 30% 8%
- Background Elevated: 220 25% 12%
- Background Card: 220 20% 15%
- Primary Brand: 215 85% 45% (Deep Professional Blue)
- Primary Hover: 215 90% 50%
- Gold Accent: 45 95% 55% (Premium Badges/Highlights)
- Text Primary: 0 0% 98%
- Text Secondary: 220 15% 70%
- Border Subtle: 220 20% 22%

**Light Mode** (if needed):
- Background: 0 0% 98%
- Card Background: 0 0% 100%
- Primary: 215 80% 40%
- Text: 220 25% 15%

## Typography

**Font Families** (Google Fonts CDN):
- Headings: 'Inter', sans-serif (weights: 600, 700, 800)
- Body: 'Inter', sans-serif (weights: 400, 500)
- Accent/Numbers: 'JetBrains Mono', monospace (for certificate codes, statistics)

**Type Scale**:
- Hero Headline: text-5xl md:text-6xl lg:text-7xl font-bold
- Section Heading: text-3xl md:text-4xl font-bold
- Card Title: text-xl font-semibold
- Body: text-base leading-relaxed
- Small/Meta: text-sm text-secondary

## Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 20, 24
- Section Padding: py-16 md:py-24 lg:py-32
- Card Padding: p-6 md:p-8
- Element Spacing: space-y-6 or gap-6
- Container: max-w-7xl mx-auto px-4

**Grid Patterns**:
- Certification Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Feature Highlights: grid-cols-1 lg:grid-cols-2 gap-12
- Stats/Numbers: grid-cols-2 md:grid-cols-4 gap-8

## Component Library

**Navigation Bar**:
- Fixed/sticky header with backdrop-blur-xl bg-background/80
- Logo left, navigation center, CTA button (gold accent) right
- Mobile: hamburger menu with slide-out drawer
- Include: Certificazioni, Percorsi, Assessment, Aziende, Login (outline), Inizia Ora (gold)

**Hero Section** (Full-width with large image):
- Height: min-h-[600px] lg:min-h-[700px]
- Background: Gradient overlay (from 220 40% 10% to transparent) over professional cybersecurity image
- Content: Left-aligned with max-w-2xl
- Elements: Eyebrow text "Certificazioni Professionali", H1, 2-line description, dual CTAs (primary gold + outline white with backdrop-blur-lg)
- Trust indicators below CTAs: "Oltre 5000+ professionisti certificati" with company logos strip

**Certification Cards**:
- Background: bg-card with border border-subtle
- Hover: transform scale-105 shadow-2xl border-primary/30 transition-all duration-300
- Structure: 
  - Top: Category badge (small pill, gold background for premium)
  - Icon area with certification logo/symbol
  - Title + difficulty level
  - Description (2 lines)
  - Stats row: duration, modules, students (with icons)
  - Bottom: CTA button + price (if applicable)
- Gold corner ribbon for "Premium" or "New" certifications

**Premium Badge Design**:
- Shape: Hexagonal or shield-shaped SVG outline
- Colors: Gold gradient (45 95% 55% to 35 90% 45%)
- Include: Glow effect (box-shadow with gold), metallic sheen
- Animation: Subtle pulse on hover

**Stats/Metrics Section**:
- Dark background panel with subtle grid pattern
- 4-column layout: Certificazioni Attive, Professionisti, Ore Formazione, Tasso Successo
- Large numbers (text-4xl font-bold) in JetBrains Mono
- Gold accent underline or icon
- Count-up animation on scroll

**Course/Path Cards**:
- Horizontal layout on desktop, vertical on mobile
- Left: Large thumbnail with category overlay
- Right: Content area with progress bar (for enrolled users)
- Skill tags as small pills below title
- Instructor info with avatar + name

**Assessment/Quiz Preview**:
- Clean card with icon, title, question count, time estimate
- "Inizia Assessment" button (outline)
- Difficulty indicator (beginner/intermediate/expert) with color coding

**Testimonials**:
- 3-column grid with cards
- Quote with large quotation marks in gold
- Avatar, name, title, company
- LinkedIn verification badge (if applicable)
- Subtle hover lift effect

**Footer**:
- Multi-column (4 sections): About, Certificazioni, Risorse, Contatti
- Newsletter signup with gold CTA
- Social links, certifications/partnerships logos
- Trust badges (ISO, privacy certifications)
- Dark background slightly lighter than body

## Images

**Hero Image**: 
Professional cybersecurity/technology workspace - server room, code on screens, or abstract network visualization. Dark toned to work with gradient overlay. Suggested placement: Full-width background, 70% opacity with dark blue gradient overlay from left.

**Certification Category Icons**:
Use Font Awesome icons for: shield-alt (security), chart-line (business), clipboard-check (compliance), tasks (assessment). Gold color for premium paths.

**Course Thumbnails**:
Abstract technical patterns, circuit boards, or relevant industry imagery. Maintain consistent 16:9 aspect ratio. Use subtle blue-to-purple gradients as fallback.

**Trust/Partner Logos**:
Client company logos in grayscale, arranged horizontally below hero. Convert to white/gold on hover.

**Instructor Avatars**:
Circular, border with gold ring for featured instructors.

## Micro-interactions

- Card hover: Lift (translateY(-4px)) + shadow + border glow
- Button hover: Gold buttons slightly brighten, outline buttons fill with subtle blue
- Badge pulse: Gentle scale animation (1 to 1.05) on featured items
- Scroll progress: Thin gold line at top showing page progress
- Loading states: Skeleton screens with shimmer effect in brand colors
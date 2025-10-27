# Layout Components

This directory contains layout components that provide the structure and navigation for the gaming platform.

## Components

### Layout
The main layout wrapper that combines all layout components.

**Props:**
- `children`: React.ReactNode
- `showSidebar`: boolean (default: true)
- `showFooter`: boolean (default: true)

**Usage:**
```tsx
import { Layout } from '@/components/layout';

<Layout showSidebar={true} showFooter={true}>
  <YourPageContent />
</Layout>
```

### Header
The main navigation header with logo, navigation menu, search, and auth buttons.

**Features:**
- Responsive design with mobile menu toggle
- Search functionality
- Authentication buttons
- Gaming-themed styling
- Sticky positioning

**Props:**
- `onMobileMenuToggle`: () => void
- `isMobileMenuOpen`: boolean

### Footer
The site footer with links, newsletter signup, and legal information.

**Features:**
- Multi-column link organization
- Newsletter subscription form
- Social media links
- Responsible gaming notice
- Gaming-themed styling

### Sidebar
The main navigation sidebar for desktop with game categories and quick links.

**Features:**
- Collapsible navigation
- Category-based organization
- Quick access links
- Promotional banner
- Responsive behavior

**Props:**
- `isOpen`: boolean
- `onClose`: () => void

### MobileNav
Mobile-specific navigation panel that slides in from the left.

**Features:**
- Full-screen mobile navigation
- Touch-friendly interface
- User account section
- Promotional content
- Smooth animations

**Props:**
- `isOpen`: boolean
- `onClose`: () => void

## Navigation Structure

### Main Navigation
- Home
- Classic Games
  - Puzzle Games
  - Memory Games
  - Arcade Games
- Team Games
  - Cooperative
  - Competitive
  - Battle Arena
- Survival Games
  - Endless Runner
  - Battle Royale
  - Last Stand
- Tournament
  - Ranked Matches
  - Championships
  - Leaderboards
- Live Games
- Promotions

### Quick Access
- Popular Games
- Hot Games
- New Releases

### Footer Links
- Games (Classic, Team, Survival, Tournament)
- Support (Help, Contact, FAQ, Chat)
- Company (About, Careers, Press, Blog)
- Legal (Terms, Privacy, Responsible Gaming, Licenses)

## Responsive Behavior

### Desktop (lg+)
- Full sidebar navigation visible
- Header with full navigation menu
- Search bar in header

### Tablet (md-lg)
- Collapsible sidebar
- Condensed header navigation
- Search bar in header

### Mobile (sm and below)
- Hidden sidebar
- Mobile navigation panel
- Hamburger menu toggle
- Search bar below header
- Touch-optimized interface

## Styling

### Theme
- Dark gaming aesthetic
- Gradient backgrounds
- Accent color highlights
- Smooth animations
- Backdrop blur effects

### Colors
- Background: `gaming-dark` and `gaming-darker`
- Accents: `gaming-accent` (orange) and `gaming-secondary` (teal)
- Text: White and gray variants
- Borders: Accent color with opacity

### Typography
- Headers: `font-gaming` (Orbitron)
- Body text: `font-sans` (Inter)
- Consistent sizing scale
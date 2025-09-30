# UI Components

This directory contains reusable UI components built with Tailwind CSS and designed for the gaming platform aesthetic.

## Components

### Button
A versatile button component with multiple variants and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean

**Usage:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg">
  Play Now
</Button>

<Button variant="outline" loading>
  Loading...
</Button>
```

### Input
A styled input component with label, error states, and icon support.

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: React.ReactNode
- `rightIcon`: React.ReactNode

**Usage:**
```tsx
import { Input } from '@/components/ui';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

<Input
  label="Search"
  placeholder="Search games..."
  leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
  error="Please enter a search term"
/>
```

### Card
A flexible card component with multiple variants and sub-components.

**Props:**
- `variant`: 'default' | 'gaming' | 'elevated'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hover`: boolean

**Sub-components:**
- `CardHeader`
- `CardTitle`
- `CardContent`
- `CardFooter`

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card variant="gaming" hover>
  <CardHeader>
    <CardTitle>Game Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Game description...</p>
  </CardContent>
</Card>
```

### Modal
A modal dialog component with backdrop and keyboard support.

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `showCloseButton`: boolean
- `closeOnOverlayClick`: boolean

**Sub-components:**
- `ModalHeader`
- `ModalBody`
- `ModalFooter`

**Usage:**
```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';

<Modal isOpen={isOpen} onClose={handleClose} title="Game Details">
  <ModalBody>
    <p>Modal content...</p>
  </ModalBody>
  <ModalFooter>
    <Button onClick={handleClose}>Close</Button>
  </ModalFooter>
</Modal>
```

## Design System

### Colors
- `gaming-dark`: Primary dark background
- `gaming-darker`: Darker background variant
- `gaming-accent`: Primary accent color (orange)
- `gaming-secondary`: Secondary accent color (teal)
- `gaming-success`: Success state color
- `gaming-warning`: Warning state color
- `gaming-danger`: Error/danger state color

### Typography
- `font-gaming`: Orbitron font for gaming aesthetic
- `font-sans`: Inter font for body text

### Animations
- `animate-fade-in`: Fade in animation
- `animate-slide-up`: Slide up animation
- `animate-pulse-slow`: Slow pulse animation

### Utility Classes
- `.text-gradient`: Gaming gradient text
- `.glow-accent`: Accent color glow effect
- `.glow-secondary`: Secondary color glow effect
- `.card-gaming`: Gaming-themed card styling
- `.backdrop-gaming`: Gaming backdrop blur effect
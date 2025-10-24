import '@testing-library/jest-dom'

// Provide a default mock for the Colyseus browser SDK to avoid Jest ESM issues
jest.mock('colyseus.js', () => {
  const createRoom = () => ({
    onMessage: jest.fn(),
    onLeave: jest.fn(),
    onError: jest.fn(),
    send: jest.fn(),
    leave: jest.fn(),
  });

  return {
    __esModule: true,
    Client: jest.fn().mockImplementation(() => ({
      joinOrCreate: jest.fn(async () => createRoom()),
      join: jest.fn(async () => createRoom()),
      create: jest.fn(async () => createRoom()),
      reconnect: jest.fn(async () => createRoom()),
    })),
    Room: jest.fn().mockImplementation(() => createRoom()),
  };
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback, options) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock touch events and mobile APIs
Object.defineProperty(window, 'ontouchstart', {
  writable: true,
  value: undefined,
})

Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  value: 0,
})

// Mock document methods for touch input adapter tests
const originalCreateElement = document.createElement.bind(document)
const originalGetElementById = document.getElementById.bind(document)

document.createElement = jest.fn((tagName) => {
  const element = originalCreateElement(tagName)
  element.remove = jest.fn()
  return element
})

document.getElementById = jest.fn((id) => {
  const element = originalGetElementById(id)
  if (element) {
    element.remove = jest.fn()
  }
  return element
})
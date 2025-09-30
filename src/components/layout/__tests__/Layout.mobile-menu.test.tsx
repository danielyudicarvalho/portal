import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Layout from '../Layout';

jest.mock('@/components/providers/PWAProvider', () => ({
  usePWA: () => ({ isOnline: true, offlineGamesCount: 0 }),
}));

jest.mock('../Sidebar', () => (props: any) => (
  <div data-testid="sidebar" data-open={props.isOpen} />
));

jest.mock('../Footer', () => () => <div />);
jest.mock('../Header', () => (props: any) => (
  <button onClick={props.onMobileMenuToggle} aria-label="Toggle mobile menu">
    Toggle
  </button>
));

jest.mock('../MobileNav', () => (props: any) => (
  <div data-testid="mobile-nav">Menu State: {props.isOpen ? 'OPEN' : 'CLOSED'}</div>
));

describe('Layout mobile menu', () => {
  it('opens mobile menu when hamburger is clicked', () => {
    render(
      <Layout>
        <div>content</div>
      </Layout>
    );

    const toggleButton = screen.getByRole('button', { name: /toggle mobile menu/i });
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('mobile-nav')).toHaveTextContent('Menu State: OPEN');
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');
  });
});

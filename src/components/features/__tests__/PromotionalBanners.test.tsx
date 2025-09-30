import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PromotionalBanners from '../PromotionalBanners';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

describe('PromotionalBanners', () => {
  it('renders section title and description', () => {
    render(<PromotionalBanners />);
    
    expect(screen.getByText('Exclusive Promotions')).toBeInTheDocument();
    expect(screen.getByText(/Don't miss out on our amazing offers/)).toBeInTheDocument();
  });

  it('renders default promotional banners', () => {
    render(<PromotionalBanners />);
    
    expect(screen.getByText('Welcome Bonus')).toBeInTheDocument();
    expect(screen.getByText('Daily Jackpot')).toBeInTheDocument();
    expect(screen.getByText('Weekend Special')).toBeInTheDocument();
  });

  it('displays banner details correctly', () => {
    render(<PromotionalBanners />);
    
    expect(screen.getByText('100% Match up to $500')).toBeInTheDocument();
    expect(screen.getByText('$50,000 Prize Pool')).toBeInTheDocument();
    expect(screen.getByText('25% Cashback')).toBeInTheDocument();
  });

  it('renders CTA buttons for each banner', () => {
    render(<PromotionalBanners />);
    
    expect(screen.getByText('Claim Now')).toBeInTheDocument();
    expect(screen.getByText('Play Now')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('displays badges for banners', () => {
    render(<PromotionalBanners />);
    
    expect(screen.getByText('New Player')).toBeInTheDocument();
    expect(screen.getByText('Hot')).toBeInTheDocument();
    expect(screen.getByText('Limited Time')).toBeInTheDocument();
  });

  it('calls banner action when clicked', () => {
    const mockAction = jest.fn();
    const customBanners = [{
      id: 'test-banner',
      title: 'Test Banner',
      subtitle: 'Test Subtitle',
      description: 'Test description',
      ctaText: 'Test CTA',
      ctaAction: mockAction,
      backgroundGradient: 'from-blue-500 to-purple-500',
      icon: <div>Test Icon</div>
    }];

    render(<PromotionalBanners banners={customBanners} />);
    
    const banner = screen.getByText('Test Banner').closest('div[class*="cursor-pointer"]');
    expect(banner).toBeInTheDocument();
    fireEvent.click(banner!);
    
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('renders View All Promotions button', () => {
    render(<PromotionalBanners />);
    
    expect(screen.getByText('View All Promotions')).toBeInTheDocument();
  });

  it('has proper responsive grid layout', () => {
    const { container } = render(<PromotionalBanners />);
    
    const grid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('displays expiry timer when expiresAt is provided', () => {
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    const customBanners = [{
      id: 'expiring-banner',
      title: 'Expiring Banner',
      subtitle: 'Limited Time',
      description: 'This offer expires soon',
      ctaText: 'Claim',
      ctaAction: () => {},
      backgroundGradient: 'from-red-500 to-pink-500',
      icon: <div>Icon</div>,
      expiresAt: futureDate
    }];

    render(<PromotionalBanners banners={customBanners} />);
    
    // Should show some form of time remaining
    expect(screen.getByText(/left|Expires/)).toBeInTheDocument();
  });

  it('has hover effects on banner cards', () => {
    const { container } = render(<PromotionalBanners />);
    
    const bannerCards = container.querySelectorAll('.hover\\:scale-105');
    expect(bannerCards.length).toBeGreaterThan(0);
  });
});
'use client';

import React, { useState, useEffect } from 'react';
import { Game } from '@/types';
import GameGrid from '@/components/features/GameGrid';
import MobileGameGrid from '@/components/features/MobileGameGrid';

interface ResponsiveGameLayoutProps {
  games: Game[];
  onGameClick?: (game: Game) => void;
  onToggleFavorite?: (gameId: string) => void;
  favoriteGameIds?: string[];
  offlineGameIds?: string[];
  loading?: boolean;
  error?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: Array<{ id: string; name: string; }>;
  emptyState?: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
  };
}

const ResponsiveGameLayout: React.FC<ResponsiveGameLayoutProps> = (props) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIsMobile = () => {
        // Check if screen width is mobile size or if touch is primary input
        const isMobileWidth = window.innerWidth < 768;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsMobile(isMobileWidth || isTouchDevice);
      };

      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);
      
      return () => window.removeEventListener('resize', checkIsMobile);
    }
  }, []);

  // Use mobile layout for mobile devices, desktop layout for desktop
  if (isMobile) {
    return <MobileGameGrid {...props} />;
  }

  return (
    <GameGrid
      {...props}
      columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
      pagination={{ enabled: true, pageSize: 12, showLoadMore: true }}
    />
  );
};

export default ResponsiveGameLayout;
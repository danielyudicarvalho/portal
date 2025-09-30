'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/layout';
import {
  HeroSection,
  GameCategories,
  PromotionalBanners,
  FeaturedGames
} from '@/components/features';
import PWAInit from '@/components/PWAInit';

export default function Home() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

  // Log when the main page loads
  console.log('🎮 GamePortal Homepage loaded!', { isSignUpModalOpen });

  const handleStartPlaying = () => {
    // TODO: Implement start playing logic (redirect to games or show sign up)
    setIsSignUpModalOpen(true);
  };

  const handleExploreGames = () => {
    // Navigate to games page
    window.location.href = '/games';
  };

  const handleCategoryClick = (category: { id: string; name: string }) => {
    // TODO: Implement category navigation
    console.log('Category clicked:', category);
  };

  const handleGameClick = (game: { id: string; title: string }) => {
    console.log('Game clicked:', game);
    // Navigate to the game page
    if (game.id === 'memdot') {
      window.location.href = '/games/memdot';
    } else {
      // For other games, show placeholder message
      alert(`Starting ${game.title}...`);
    }
  };

  const handleToggleFavorite = (gameId: string) => {
    // TODO: Implement favorite toggle logic
    console.log('Toggle favorite:', gameId);
  };

  return (
    <Layout>
      <PWAInit />

      {/* Hero Section */}
      <HeroSection
        onStartPlaying={handleStartPlaying}
        onExploreGames={handleExploreGames}
      />

      {/* Game Categories */}
      <GameCategories
        onCategoryClick={handleCategoryClick}
      />

      {/* Promotional Banners */}
      <PromotionalBanners />

      {/* Featured Games */}
      <FeaturedGames
        onGameClick={handleGameClick}
        onToggleFavorite={handleToggleFavorite}
      />
    </Layout>
  );
}
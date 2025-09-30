'use client';

import React from 'react';
import { Button } from '@/components/ui';
import { PlayIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface HeroSectionProps {
  onStartPlaying?: () => void;
  onExploreGames?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  onStartPlaying, 
  onExploreGames 
}) => {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16 md:py-24 lg:py-32">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gaming-accent/10 via-transparent to-gaming-secondary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gaming-accent/5 via-transparent to-transparent" />
      
      {/* Floating Elements */}
      <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-12 h-12 sm:w-20 sm:h-20 bg-gaming-accent/20 rounded-full blur-xl animate-pulse-slow" />
      <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-20 h-20 sm:w-32 sm:h-32 bg-gaming-secondary/20 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      <div className="relative container mx-auto px-4 text-center">
        {/* Main Heading */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-gaming font-bold text-gradient mb-4 sm:mb-6 animate-fade-in leading-tight">
            Welcome to GamePortal
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed animate-slide-up px-2">
            Experience the ultimate gaming platform with thousands of games, live betting, and exclusive promotions. 
            Join millions of players worldwide!
          </p>
        </div>

        {/* Call to Action Buttons */}
        <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 animate-slide-up px-4" style={{ animationDelay: '0.2s' }}>
          <Button 
            size="lg" 
            className="glow-accent group relative overflow-hidden touch-manipulation tap-target w-full xs:w-auto"
            onClick={onStartPlaying}
          >
            <PlayIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm sm:text-base">Start Playing</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="group touch-manipulation tap-target w-full xs:w-auto"
            onClick={onExploreGames}
          >
            <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:rotate-12 transition-transform" />
            <span className="text-sm sm:text-base">Explore Games</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto animate-slide-up px-4" style={{ animationDelay: '0.4s' }}>
          {[
            { label: 'Total Games', value: '2,500+', icon: '🎮' },
            { label: 'Active Players', value: '50K+', icon: '👥' },
            { label: 'Daily Jackpots', value: '$1M+', icon: '💰' },
            { label: 'Win Rate', value: '96.5%', icon: '🏆' }
          ].map((stat, index) => (
            <div key={index} className="text-center group touch-manipulation">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gradient mb-1">
                {stat.value}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm md:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
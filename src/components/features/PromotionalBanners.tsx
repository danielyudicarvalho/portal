'use client';

import React from 'react';
import { Button } from '@/components/ui';
import { 
  GiftIcon, 
  StarIcon, 
  BoltIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/solid';

interface PromotionalBanner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaAction: () => void;
  backgroundGradient: string;
  icon: React.ReactNode;
  badge?: string;
  expiresAt?: Date;
}

interface PromotionalBannersProps {
  banners?: PromotionalBanner[];
}

const PromotionalBanners: React.FC<PromotionalBannersProps> = ({ banners }) => {
  const defaultBanners: PromotionalBanner[] = [
    {
      id: 'welcome-bonus',
      title: 'Welcome Bonus',
      subtitle: '100% Match up to $500',
      description: 'Double your first deposit and get 50 free spins on our most popular slots!',
      ctaText: 'Claim Now',
      ctaAction: () => console.log('Claim welcome bonus'),
      backgroundGradient: 'from-gaming-accent via-orange-500 to-red-500',
      icon: <GiftIcon className="h-8 w-8" />,
      badge: 'New Player',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    {
      id: 'daily-jackpot',
      title: 'Daily Jackpot',
      subtitle: '$50,000 Prize Pool',
      description: 'Play any slot game today for a chance to win the daily progressive jackpot!',
      ctaText: 'Play Now',
      ctaAction: () => console.log('Play daily jackpot'),
      backgroundGradient: 'from-gaming-secondary via-blue-500 to-purple-500',
      icon: <StarIcon className="h-8 w-8" />,
      badge: 'Hot'
    },
    {
      id: 'weekend-special',
      title: 'Weekend Special',
      subtitle: '25% Cashback',
      description: 'Get 25% cashback on all your weekend losses. Play more, lose less!',
      ctaText: 'Learn More',
      ctaAction: () => console.log('Weekend special'),
      backgroundGradient: 'from-purple-500 via-pink-500 to-gaming-accent',
      icon: <BoltIcon className="h-8 w-8" />,
      badge: 'Limited Time'
    }
  ];

  const activeBanners = banners || defaultBanners;

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expires soon';
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gaming-dark/50 to-gaming-darker/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-gaming font-bold text-white mb-4">
            Exclusive Promotions
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Don&apos;t miss out on our amazing offers and bonuses designed just for you
          </p>
        </div>

        {/* Banners Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeBanners.map((banner, index) => (
            <div 
              key={banner.id}
              className={`relative overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-105 animate-slide-up rounded-lg shadow-lg hover:shadow-xl`}
              style={{ animationDelay: `${index * 0.15}s` }}
              onClick={banner.ctaAction}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${banner.backgroundGradient} opacity-90`} />
              
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)] opacity-50" />
              
              {/* Badge */}
              {banner.badge && (
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                  {banner.badge}
                </div>
              )}

              <div className="relative p-6 text-white">
                {/* Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {banner.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 group-hover:scale-105 transition-transform duration-300">
                    {banner.title}
                  </h3>
                  <div className="text-xl font-semibold mb-3 opacity-90">
                    {banner.subtitle}
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {banner.description}
                  </p>
                </div>

                {/* Expiry Timer */}
                {banner.expiresAt && (
                  <div className="mb-4 text-xs text-white/70 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 inline-block">
                    ⏰ {formatTimeRemaining(banner.expiresAt)}
                  </div>
                )}

                {/* CTA Button */}
                <Button 
                  className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm group-hover:translate-y-0 transform translate-y-1 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    banner.ctaAction();
                  }}
                >
                  {banner.ctaText}
                  <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Promotions */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="group"
          >
            View All Promotions
            <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PromotionalBanners;
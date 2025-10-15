'use client';

import React from 'react';
import Card from '@/components/ui/Card';

interface RoomCardSkeletonProps {
  className?: string;
}

export const RoomCardSkeleton: React.FC<RoomCardSkeletonProps> = ({ className = '' }) => {
  return (
    <Card className={`p-4 animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-3">
        {/* Room code skeleton */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        
        {/* Status badge skeleton */}
        <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
      </div>

      {/* Player count skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
        </div>
        
        {/* Privacy indicator skeleton */}
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
      </div>

      {/* Game info skeleton */}
      <div className="mb-4">
        <div className="w-24 h-3 bg-gray-200 rounded mb-1"></div>
        <div className="w-32 h-3 bg-gray-200 rounded"></div>
      </div>

      {/* Action button skeleton */}
      <div className="w-full h-9 bg-gray-200 rounded"></div>
    </Card>
  );
};

interface RoomListSkeletonProps {
  count?: number;
  className?: string;
}

export const RoomListSkeleton: React.FC<RoomListSkeletonProps> = ({ 
  count = 6, 
  className = '' 
}) => {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <RoomCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default RoomCardSkeleton;
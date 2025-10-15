'use client';

import React from 'react';
import { Modal, Button } from '@/components/ui';
import { 
  UserGroupIcon,
  XMarkIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/solid';
import { RoomAlternative } from '@/lib/room-service';

interface RoomAlternativesModalProps {
  isOpen: boolean;
  onClose: () => void;
  alternatives: RoomAlternative[];
  onJoinAlternative: (roomId: string) => void;
  originalRoomCode?: string;
  isJoining?: boolean;
  joiningRoomId?: string | null;
}

const RoomAlternativesModal: React.FC<RoomAlternativesModalProps> = ({
  isOpen,
  onClose,
  alternatives,
  onJoinAlternative,
  originalRoomCode,
  isJoining = false,
  joiningRoomId = null
}) => {
  const handleJoinAlternative = (roomId: string) => {
    onJoinAlternative(roomId);
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.8) return { label: 'Perfect Match', color: 'text-green-400', stars: 3 };
    if (similarity >= 0.6) return { label: 'Good Match', color: 'text-yellow-400', stars: 2 };
    return { label: 'Similar Room', color: 'text-blue-400', stars: 1 };
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-3 w-3 ${i < count ? 'text-gaming-accent' : 'text-gray-600'}`}
      />
    ));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Full - Alternative Rooms">
      <div className="space-y-4">
        {/* Header Message */}
        <div className="text-center p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="text-yellow-400 text-4xl mb-2">🚪</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Room {originalRoomCode} is Full
          </h3>
          <p className="text-gray-300 text-sm">
            Don't worry! We found some similar rooms you can join instead.
          </p>
        </div>

        {/* Alternatives List */}
        {alternatives.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alternatives.map((alternative, index) => {
              const similarityInfo = getSimilarityLabel(alternative.similarity);
              const isCurrentlyJoining = joiningRoomId === alternative.roomId;
              
              return (
                <div
                  key={alternative.roomId}
                  className="bg-gaming-dark border border-gaming-accent/20 rounded-lg p-4 hover:border-gaming-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold text-lg text-white">
                        {alternative.roomCode}
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(similarityInfo.stars)}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${similarityInfo.color} bg-current/10`}>
                      {similarityInfo.label}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <UserGroupIcon className="h-4 w-4" />
                      <span className="text-sm">
                        {alternative.playerCount}/{alternative.maxPlayers} players
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round(alternative.similarity * 100)}% match
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                    <div 
                      className="h-full bg-gaming-accent rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(alternative.playerCount / alternative.maxPlayers) * 100}%` 
                      }}
                    />
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-gaming-accent hover:bg-gaming-accent/80"
                    onClick={() => handleJoinAlternative(alternative.roomId)}
                    loading={isCurrentlyJoining}
                    disabled={isJoining}
                  >
                    {isCurrentlyJoining ? (
                      'Joining...'
                    ) : (
                      <>
                        <ArrowRightIcon className="h-4 w-4 mr-2" />
                        Join This Room
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg mb-2">No Alternative Rooms Found</p>
            <p className="text-sm">
              Try creating a new room or refreshing to see if new rooms become available.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isJoining}
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RoomAlternativesModal;
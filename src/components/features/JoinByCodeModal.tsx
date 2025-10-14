'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { 
  HashtagIcon,
  XMarkIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

interface JoinByCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinByCode: (code: string) => Promise<void>;
  isJoining?: boolean;
  error?: string | null;
}

const JoinByCodeModal: React.FC<JoinByCodeModalProps> = ({
  isOpen,
  onClose,
  onJoinByCode,
  isJoining = false,
  error = null
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRoomCode('');
      setValidationError(null);
      // Focus input after modal animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Format room code as user types (uppercase, max 6 chars)
  const handleCodeChange = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const formatted = value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
    setRoomCode(formatted);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  // Validate room code format
  const validateRoomCode = (code: string): boolean => {
    if (!code) {
      setValidationError('Please enter a room code');
      return false;
    }
    
    if (code.length !== 6) {
      setValidationError('Room code must be exactly 6 characters');
      return false;
    }
    
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setValidationError('Room code can only contain letters and numbers');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRoomCode(roomCode)) {
      return;
    }
    
    try {
      await onJoinByCode(roomCode);
      // Modal will be closed by parent component on success
    } catch (error) {
      // Error handling is done by parent component
      console.error('Failed to join room by code:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Only allow alphanumeric characters
    const char = e.key;
    if (!/[A-Za-z0-9]/.test(char) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(char)) {
      e.preventDefault();
    }
  };

  const handleClose = () => {
    if (!isJoining) {
      onClose();
    }
  };

  // Format display of room code with spacing for better readability
  const formatDisplayCode = (code: string) => {
    return code.replace(/(.{3})/g, '$1 ').trim();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Join Room by Code"
      className="max-w-md mx-4 sm:mx-auto animate-modal-enter"
      aria-describedby="join-by-code-description"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Instructions */}
        <div className="text-center">
          <div className="text-gaming-accent text-3xl sm:text-4xl mb-2 sm:mb-3">
            <HashtagIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto" aria-hidden="true" />
          </div>
          <p id="join-by-code-description" className="text-gray-300 text-sm px-2">
            Enter the 6-character room code shared by your friend to join their private room.
          </p>
        </div>

        {/* Room Code Input */}
        <div className="space-y-2">
          <label htmlFor="roomCode" className="block text-sm font-medium text-white">
            Room Code
          </label>
          <div className="relative">
            <Input
              ref={inputRef}
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ABC123"
              className="text-center text-base sm:text-lg font-mono tracking-widest uppercase min-h-[44px] touch-manipulation"
              maxLength={6}
              disabled={isJoining}
              autoComplete="off"
              spellCheck={false}
            />
            {roomCode && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {roomCode.length}/6
              </div>
            )}
          </div>
          
          {/* Display formatted code for better readability */}
          {roomCode && (
            <div className="text-center">
              <span className="text-gaming-accent font-mono text-lg tracking-wider">
                {formatDisplayCode(roomCode)}
              </span>
            </div>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{validationError}</span>
          </div>
        )}

        {/* Server Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[44px] touch-manipulation tap-target transition-all duration-200 transform hover:scale-105 active:scale-95"
            onClick={handleClose}
            disabled={isJoining}
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gaming-accent hover:bg-gaming-accent/80 hover:shadow-lg hover:shadow-gaming-accent/25 min-h-[44px] touch-manipulation tap-target transition-all duration-200 transform hover:scale-105 active:scale-95"
            loading={isJoining}
            disabled={isJoining || !roomCode || roomCode.length !== 6}
          >
            {isJoining ? (
              'Joining...'
            ) : (
              <>
                <ArrowRightIcon className="h-4 w-4 mr-2" />
                Join Room
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Room codes are case-insensitive and expire when the room closes.</p>
          <p>Ask your friend to share their room code from the room lobby.</p>
        </div>
      </form>
    </Modal>
  );
};

export default JoinByCodeModal;
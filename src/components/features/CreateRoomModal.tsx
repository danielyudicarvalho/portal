'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { 
  PlusIcon,
  XMarkIcon,
  UserGroupIcon,
  LockClosedIcon,
  LockOpenIcon,
  CogIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';

interface GameInfo {
  id: string;
  name: string;
  roomType: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
  features: string[];
  settings?: GameSettings;
}

interface GameSettings {
  [key: string]: {
    type: 'boolean' | 'number' | 'string' | 'select';
    label: string;
    default: any;
    options?: any[];
    min?: number;
    max?: number;
  };
}

interface RoomCreationOptions {
  isPrivate: boolean;
  maxPlayers: number;
  gameSettings: Record<string, any>;
  roomName?: string;
}

interface CreateRoomModalProps {
  gameInfo: GameInfo;
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (options: RoomCreationOptions) => Promise<void>;
  isCreating?: boolean;
  error?: string | null;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  gameInfo,
  isOpen,
  onClose,
  onCreateRoom,
  isCreating = false,
  error = null
}) => {
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(gameInfo.maxPlayers);
  const [gameSettings, setGameSettings] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRoomName('');
      setIsPrivate(false);
      setMaxPlayers(gameInfo.maxPlayers);
      setValidationErrors({});
      
      // Initialize game settings with defaults
      const defaultSettings: Record<string, any> = {};
      if (gameInfo.settings) {
        Object.entries(gameInfo.settings).forEach(([key, setting]) => {
          defaultSettings[key] = setting.default;
        });
      }
      setGameSettings(defaultSettings);
    }
  }, [isOpen, gameInfo]);

  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate room name (optional but if provided, must be valid)
    if (roomName.trim() && roomName.trim().length < 3) {
      errors.roomName = 'Room name must be at least 3 characters';
    }
    if (roomName.trim() && roomName.trim().length > 30) {
      errors.roomName = 'Room name must be less than 30 characters';
    }

    // Validate max players
    if (maxPlayers < gameInfo.minPlayers) {
      errors.maxPlayers = `Minimum ${gameInfo.minPlayers} players required`;
    }
    if (maxPlayers > gameInfo.maxPlayers) {
      errors.maxPlayers = `Maximum ${gameInfo.maxPlayers} players allowed`;
    }

    // Validate game settings
    if (gameInfo.settings) {
      Object.entries(gameInfo.settings).forEach(([key, setting]) => {
        const value = gameSettings[key];
        
        if (setting.type === 'number') {
          if (setting.min !== undefined && value < setting.min) {
            errors[`setting_${key}`] = `${setting.label} must be at least ${setting.min}`;
          }
          if (setting.max !== undefined && value > setting.max) {
            errors[`setting_${key}`] = `${setting.label} must be at most ${setting.max}`;
          }
        }
        
        if (setting.type === 'string' && typeof value === 'string') {
          if (value.trim().length === 0) {
            errors[`setting_${key}`] = `${setting.label} is required`;
          }
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const options: RoomCreationOptions = {
      isPrivate,
      maxPlayers,
      gameSettings,
      roomName: roomName.trim() || undefined
    };
    
    try {
      await onCreateRoom(options);
      // Modal will be closed by parent component on success
    } catch (error) {
      // Error handling is done by parent component
      console.error('Failed to create room:', error);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  const handleGameSettingChange = (key: string, value: any) => {
    setGameSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear validation error for this setting
    if (validationErrors[`setting_${key}`]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`setting_${key}`];
        return newErrors;
      });
    }
  };

  const renderGameSetting = (key: string, setting: GameSettings[string]) => {
    const value = gameSettings[key];
    const error = validationErrors[`setting_${key}`];

    switch (setting.type) {
      case 'boolean':
        return (
          <div key={key} className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                id={`setting-${key}`}
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleGameSettingChange(key, e.target.checked)}
                disabled={isCreating}
                className="w-4 h-4 text-gaming-accent bg-gaming-darker border-gray-600 rounded focus:ring-gaming-accent/50 focus:ring-2"
                aria-describedby={error ? `setting-${key}-error` : undefined}
              />
              <span className="text-sm font-medium text-white">{setting.label}</span>
            </label>
            {error && (
              <p id={`setting-${key}-error`} className="text-sm text-gaming-danger" role="alert">
                {error}
              </p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-white">
              {setting.label}
            </label>
            <Input
              type="number"
              value={value || setting.default}
              onChange={(e) => handleGameSettingChange(key, parseInt(e.target.value) || setting.default)}
              min={setting.min}
              max={setting.max}
              disabled={isCreating}
              error={error}
            />
          </div>
        );

      case 'select':
        return (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-white">
              {setting.label}
            </label>
            <select
              value={value || setting.default}
              onChange={(e) => handleGameSettingChange(key, e.target.value)}
              disabled={isCreating}
              className="w-full px-3 py-2.5 bg-gaming-darker border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gaming-accent/50 focus:border-gaming-accent min-h-[44px] touch-manipulation"
            >
              {setting.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && (
              <p className="text-sm text-gaming-danger">{error}</p>
            )}
          </div>
        );

      case 'string':
        return (
          <div key={key} className="space-y-2">
            <Input
              label={setting.label}
              type="text"
              value={value || ''}
              onChange={(e) => handleGameSettingChange(key, e.target.value)}
              disabled={isCreating}
              error={error}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={`Create ${gameInfo.name} Room`}
      className="max-w-lg mx-4 sm:mx-auto animate-modal-enter"
      aria-describedby="create-room-description"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Game Info Header */}
        <div className="text-center">
          <div className="text-gaming-accent text-3xl sm:text-4xl mb-2 sm:mb-3">
            <PlusIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto" aria-hidden="true" />
          </div>
          <p id="create-room-description" className="text-gray-300 text-sm px-2">
            Create a new {gameInfo.name} room and invite friends to play together.
          </p>
        </div>

        {/* Room Name (Optional) */}
        <div className="space-y-2">
          <Input
            label="Room Name (Optional)"
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={`${gameInfo.name} Room`}
            disabled={isCreating}
            error={validationErrors.roomName}
            helperText="Give your room a custom name to help friends identify it"
            maxLength={30}
          />
        </div>

        {/* Privacy Setting */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white">
            Room Privacy
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              disabled={isCreating}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation tap-target ${
                !isPrivate
                  ? 'border-gaming-accent bg-gaming-accent/10 text-gaming-accent shadow-lg shadow-gaming-accent/20'
                  : 'border-gray-600 bg-gaming-darker text-gray-300 hover:border-gray-500 active:border-gray-500 hover:shadow-md'
              }`}
            >
              <LockOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2" />
              <div className="text-xs sm:text-sm font-medium">Public</div>
              <div className="text-xs opacity-75 hidden xs:block">Anyone can join</div>
            </button>
            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              disabled={isCreating}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation tap-target ${
                isPrivate
                  ? 'border-gaming-accent bg-gaming-accent/10 text-gaming-accent shadow-lg shadow-gaming-accent/20'
                  : 'border-gray-600 bg-gaming-darker text-gray-300 hover:border-gray-500 active:border-gray-500 hover:shadow-md'
              }`}
            >
              <LockClosedIcon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2" />
              <div className="text-xs sm:text-sm font-medium">Private</div>
              <div className="text-xs opacity-75 hidden xs:block">Invite only</div>
            </button>
          </div>
        </div>

        {/* Max Players */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            <UserGroupIcon className="h-4 w-4 inline mr-2" />
            Maximum Players
          </label>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <input
              type="range"
              min={gameInfo.minPlayers}
              max={gameInfo.maxPlayers}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              disabled={isCreating}
              className="flex-1 h-2 bg-gaming-darker rounded-lg appearance-none cursor-pointer slider touch-manipulation"
            />
            <div className="text-gaming-accent font-bold text-lg min-w-[2.5rem] sm:min-w-[3rem] text-center">
              {maxPlayers}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Min: {gameInfo.minPlayers}</span>
            <span>Max: {gameInfo.maxPlayers}</span>
          </div>
          {validationErrors.maxPlayers && (
            <p className="text-sm text-gaming-danger">{validationErrors.maxPlayers}</p>
          )}
        </div>

        {/* Game Settings */}
        {gameInfo.settings && Object.keys(gameInfo.settings).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CogIcon className="h-5 w-5 text-gaming-accent" />
              <h3 className="text-lg font-semibold text-white">Game Settings</h3>
            </div>
            <div className="space-y-4 p-4 bg-gaming-darker/50 rounded-lg border border-gray-700">
              {Object.entries(gameInfo.settings).map(([key, setting]) =>
                renderGameSetting(key, setting)
              )}
            </div>
          </div>
        )}

        {/* Server Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Info Box */}
        <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-blue-300 text-sm space-y-1">
            <p>
              {isPrivate 
                ? 'Private rooms require a room code to join. Share the code with friends.'
                : 'Public rooms are visible to all players and can be joined freely.'
              }
            </p>
            <p>You will automatically become the room host and can start the game when ready.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[44px] touch-manipulation tap-target transition-all duration-200 transform hover:scale-105 active:scale-95"
            onClick={handleClose}
            disabled={isCreating}
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gaming-accent hover:bg-gaming-accent/80 hover:shadow-lg hover:shadow-gaming-accent/25 min-h-[44px] touch-manipulation tap-target transition-all duration-200 transform hover:scale-105 active:scale-95"
            loading={isCreating}
            disabled={isCreating}
          >
            {isCreating ? (
              'Creating Room...'
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Room
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRoomModal;
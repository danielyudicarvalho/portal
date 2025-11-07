'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrophyIcon } from '@heroicons/react/24/outline';


interface Game {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
}

interface CreateChampionshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (championshipData: any) => Promise<void>;
  games: Game[];
  isLoading?: boolean;
  preSelectedGameId?: string;
}

export function CreateChampionshipModal({
  isOpen,
  onClose,
  onSubmit,
  games,
  isLoading = false,
  preSelectedGameId,
}: CreateChampionshipModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    gameId: '',
    entryFee: 10,
    maxParticipants: '',
    duration: '1d', // Default to 1 day
    isPublic: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set pre-selected game when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        gameId: preSelectedGameId || prev.gameId,
      }));
    }
  }, [isOpen, preSelectedGameId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.gameId) {
      newErrors.gameId = 'Please select a game';
    }

    if (formData.entryFee < 0) {
      newErrors.entryFee = 'Entry fee cannot be negative';
    }

    if (formData.maxParticipants && parseInt(formData.maxParticipants) < 2) {
      newErrors.maxParticipants = 'Must allow at least 2 participants';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      entryFee: parseInt(formData.entryFee.toString()),
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
    };

    try {
      await onSubmit(submitData);
      // Reset form
      setFormData({
        title: '',
        description: '',
        gameId: '',
        entryFee: 10,
        maxParticipants: '',
        duration: '1d',
        isPublic: true,
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating championship:', error);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gaming-dark border border-gaming-accent/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gaming-accent/20">
          <div className="flex items-center">
            <TrophyIcon className="h-6 w-6 text-gaming-accent mr-3" />
            <h2 className="text-xl font-semibold text-white">Create Championship</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Championship Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gaming-darker border border-gaming-accent/30 rounded text-white placeholder-gray-400 focus:border-gaming-accent focus:outline-none"
                placeholder="Enter championship title"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-gaming-darker border border-gaming-accent/30 rounded text-white placeholder-gray-400 focus:border-gaming-accent focus:outline-none resize-none"
                placeholder="Describe your championship (optional)"
              />
            </div>

            {/* Only show game selection if no game is pre-selected */}
            {!preSelectedGameId && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game *
                </label>
                <select
                  name="gameId"
                  value={formData.gameId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gaming-darker border border-gaming-accent/30 rounded text-white focus:border-gaming-accent focus:outline-none"
                >
                  <option value="">Select a game</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>
                {errors.gameId && <p className="text-red-400 text-sm mt-1">{errors.gameId}</p>}
              </div>
            )}

            {/* Show selected game info when pre-selected */}
            {preSelectedGameId && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game
                </label>
                <div className="w-full px-3 py-2 bg-gaming-darker border border-gaming-accent/30 rounded text-gaming-accent font-medium">
                  {games.find(game => game.id === preSelectedGameId)?.title || 'Selected Game'}
                </div>
              </div>
            )}
          </div>

          {/* Championship Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Championship Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Fee (Credits) *
                </label>
                <input
                  type="number"
                  name="entryFee"
                  value={formData.entryFee}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 bg-gaming-darker border border-gaming-accent/30 rounded text-white placeholder-gray-400 focus:border-gaming-accent focus:outline-none"
                />
                {errors.entryFee && <p className="text-red-400 text-sm mt-1">{errors.entryFee}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="2"
                  className="w-full px-3 py-2 bg-gaming-darker border border-gaming-accent/30 rounded text-white placeholder-gray-400 focus:border-gaming-accent focus:outline-none"
                  placeholder="Unlimited"
                />
                {errors.maxParticipants && <p className="text-red-400 text-sm mt-1">{errors.maxParticipants}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Championship Duration *
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gaming-darker border border-gaming-accent/30 rounded text-white focus:border-gaming-accent focus:outline-none"
              >
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
                <option value="1m">1 Month</option>
              </select>
              {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
            </div>
          </div>



          {/* Privacy */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="mr-2 rounded border-gaming-accent/30 bg-gaming-darker text-gaming-accent focus:ring-gaming-accent"
              />
              <span className="text-sm text-gray-300">
                Make this championship public (visible to all players)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gaming-accent/20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gaming-darker border border-gaming-accent/30 hover:border-gaming-accent/50 text-white font-medium rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gaming-accent hover:bg-gaming-accent/80 disabled:bg-gaming-accent/50 text-white font-medium rounded transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Championship'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
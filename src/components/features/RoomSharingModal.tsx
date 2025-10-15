'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { 
  ShareIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  LinkIcon,
  QrCodeIcon,
  UserGroupIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';

interface RoomSharingData {
  roomId: string;
  roomCode: string;
  gameId: string;
  gameName: string;
  inviteLink: string;
  isPrivate: boolean;
  maxPlayers: number;
}

interface RoomSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomData: RoomSharingData | null;
  onStartGame?: () => void;
}

const RoomSharingModal: React.FC<RoomSharingModalProps> = ({
  isOpen,
  onClose,
  roomData,
  onStartGame
}) => {
  const [copiedItem, setCopiedItem] = useState<'code' | 'link' | null>(null);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    // Check if Web Share API is supported
    setShareSupported(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  useEffect(() => {
    // Reset copied state when modal opens/closes
    if (isOpen) {
      setCopiedItem(null);
    }
  }, [isOpen]);

  if (!roomData) return null;

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedItem(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedItem(type);
      setTimeout(() => {
        setCopiedItem(null);
      }, 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!shareSupported) return;

    const shareData = {
      title: `Join my ${roomData.gameName} room!`,
      text: `I've created a ${roomData.gameName} room. Join me using room code: ${roomData.roomCode}`,
      url: roomData.inviteLink
    };

    try {
      await navigator.share(shareData);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatRoomCode = (code: string) => {
    return code.replace(/(.{3})/g, '$1 ').trim();
  };

  const generateQRCodeUrl = (text: string) => {
    // Using a simple QR code service - in production, you might want to use a more robust solution
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Room Created Successfully!"
      className="max-w-md"
    >
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="text-gaming-accent text-4xl mb-3">
            <CheckIcon className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Your {roomData.gameName} room is ready!
          </h3>
          <p className="text-gray-300 text-sm">
            Share the room code or invite link with friends to start playing together.
          </p>
        </div>

        {/* Room Information */}
        <div className="bg-gaming-darker/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-5 w-5 text-gaming-accent" />
              <span className="text-white font-medium">Room Details</span>
            </div>
            <div className="text-xs text-gray-400">
              {roomData.isPrivate ? 'Private' : 'Public'} • Max {roomData.maxPlayers} players
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Room Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Room Code
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gaming-dark rounded-lg p-3 border border-gray-600">
                  <div className="text-gaming-accent font-mono text-xl font-bold text-center tracking-wider">
                    {formatRoomCode(roomData.roomCode)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={copiedItem === 'code' ? 'primary' : 'outline'}
                  onClick={() => copyToClipboard(roomData.roomCode, 'code')}
                  className="min-w-[80px]"
                >
                  {copiedItem === 'code' ? (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Invite Link */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Invite Link
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gaming-dark rounded-lg p-3 border border-gray-600">
                  <div className="text-gray-300 text-sm truncate">
                    {roomData.inviteLink}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={copiedItem === 'link' ? 'primary' : 'outline'}
                  onClick={() => copyToClipboard(roomData.inviteLink, 'link')}
                  className="min-w-[80px]"
                >
                  {copiedItem === 'link' ? (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sharing Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white flex items-center">
            <ShareIcon className="h-4 w-4 mr-2" />
            Share with Friends
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Native Share (if supported) */}
            {shareSupported && (
              <Button
                variant="outline"
                onClick={handleNativeShare}
                className="flex-1"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
            
            {/* QR Code */}
            <Button
              variant="outline"
              onClick={() => {
                // Open QR code in new window/tab
                const qrUrl = generateQRCodeUrl(roomData.inviteLink);
                window.open(qrUrl, '_blank', 'width=300,height=300');
              }}
              className="flex-1"
            >
              <QrCodeIcon className="h-4 w-4 mr-2" />
              QR Code
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-blue-300 text-sm space-y-1">
            <p className="font-medium">How to invite friends:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Share the room code: Friends can use "Join by Code" button</li>
              <li>Send the invite link: Direct access to your room</li>
              <li>Show the QR code: Easy scanning with mobile devices</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Close
          </Button>
          {onStartGame && (
            <Button
              type="button"
              className="flex-1 bg-gaming-accent hover:bg-gaming-accent/80"
              onClick={onStartGame}
            >
              <UserGroupIcon className="h-4 w-4 mr-2" />
              Go to Room
            </Button>
          )}
        </div>

        {/* Additional Tips */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Room codes expire when the room is closed.</p>
          <p>As the host, you can start the game when players are ready.</p>
        </div>
      </div>
    </Modal>
  );
};

export default RoomSharingModal;
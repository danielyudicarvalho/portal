import { GameConnectionInfo } from '@/lib/game-navigation';

declare global {
  interface Window {
    gameConnectionInfo?: GameConnectionInfo;
  }
}

export {};
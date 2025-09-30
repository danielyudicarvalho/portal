import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { NotificationManager } from '@/lib/notification-manager';

// Mock the NotificationManager
jest.mock('@/lib/notification-manager');

const mockNotificationManager = {
  initialize: jest.fn(),
  isNotificationSupported: jest.fn(),
  getPermissionStatus: jest.fn(),
  isSubscribed: jest.fn(),
  requestPermission: jest.fn(),
  subscribeToNotifications: jest.fn(),
  unsubscribeFromNotifications: jest.fn(),
  sendLocalNotification: jest.fn(),
  notifyNewGame: jest.fn(),
};

(NotificationManager.getInstance as jest.Mock).mockReturnValue(mockNotificationManager);

// Mock document visibility API
Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible',
});

Object.defineProperty(document, 'addEventListener', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(document, 'removeEventListener', {
  writable: true,
  value: jest.fn(),
});

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default mock return values
    mockNotificationManager.initialize.mockResolvedValue(undefined);
    mockNotificationManager.isNotificationSupported.mockReturnValue(true);
    mockNotificationManager.getPermissionStatus.mockReturnValue('default');
    mockNotificationManager.isSubscribed.mockReturnValue(false);
    mockNotificationManager.requestPermission.mockResolvedValue('granted');
    mockNotificationManager.subscribeToNotifications.mockResolvedValue({});
    mockNotificationManager.unsubscribeFromNotifications.mockResolvedValue(true);
    mockNotificationManager.sendLocalNotification.mockResolvedValue(undefined);
    mockNotificationManager.notifyNewGame.mockResolvedValue(undefined);
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.state.isSupported).toBe(false);
    expect(result.current.state.permission).toBe('default');
    expect(result.current.state.isSubscribed).toBe(false);
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it('should initialize notification manager on mount', async () => {
    renderHook(() => useNotifications());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockNotificationManager.initialize).toHaveBeenCalled();
  });

  it('should update state after initialization', async () => {
    mockNotificationManager.isNotificationSupported.mockReturnValue(true);
    mockNotificationManager.getPermissionStatus.mockReturnValue('granted');
    mockNotificationManager.isSubscribed.mockReturnValue(true);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.state.isSupported).toBe(true);
    expect(result.current.state.permission).toBe('granted');
    expect(result.current.state.isSubscribed).toBe(true);
  });

  it('should handle initialization error', async () => {
    const error = new Error('Initialization failed');
    mockNotificationManager.initialize.mockRejectedValue(error);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.state.error).toBe('Initialization failed');
  });

  it('should request permission', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mockNotificationManager.requestPermission).toHaveBeenCalled();
    expect(result.current.state.permission).toBe('granted');
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should handle permission request error', async () => {
    const error = new Error('Permission denied');
    mockNotificationManager.requestPermission.mockRejectedValue(error);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.state.error).toBe('Permission denied');
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should subscribe to notifications', async () => {
    const { result } = renderHook(() => useNotifications());
    const vapidKey = 'test-vapid-key';

    await act(async () => {
      await result.current.subscribe(vapidKey);
    });

    expect(mockNotificationManager.subscribeToNotifications).toHaveBeenCalledWith(vapidKey);
    expect(result.current.state.isSubscribed).toBe(true);
    expect(result.current.state.permission).toBe('granted');
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should handle subscription error', async () => {
    const error = new Error('Subscription failed');
    mockNotificationManager.subscribeToNotifications.mockRejectedValue(error);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.state.error).toBe('Subscription failed');
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should unsubscribe from notifications', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(mockNotificationManager.unsubscribeFromNotifications).toHaveBeenCalled();
    expect(result.current.state.isSubscribed).toBe(false);
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should handle unsubscription error', async () => {
    const error = new Error('Unsubscription failed');
    mockNotificationManager.unsubscribeFromNotifications.mockRejectedValue(error);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(result.current.state.error).toBe('Unsubscription failed');
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should send notification', async () => {
    const { result } = renderHook(() => useNotifications());
    const config = {
      title: 'Test Notification',
      body: 'Test body',
    };

    await act(async () => {
      await result.current.sendNotification(config);
    });

    expect(mockNotificationManager.sendLocalNotification).toHaveBeenCalledWith(config);
  });

  it('should handle send notification error', async () => {
    const error = new Error('Send failed');
    mockNotificationManager.sendLocalNotification.mockRejectedValue(error);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.sendNotification({ title: 'Test', body: 'Test' });
    });

    expect(result.current.state.error).toBe('Send failed');
  });

  it('should notify new game', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.notifyNewGame('Test Game', 'test-game');
    });

    expect(mockNotificationManager.notifyNewGame).toHaveBeenCalledWith('Test Game', 'test-game');
  });

  it('should handle notify new game error', async () => {
    const error = new Error('Notify failed');
    mockNotificationManager.notifyNewGame.mockRejectedValue(error);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.notifyNewGame('Test Game', 'test-game');
    });

    expect(result.current.state.error).toBe('Notify failed');
  });

  it('should clear error', async () => {
    const error = new Error('Test error');
    mockNotificationManager.initialize.mockRejectedValue(error);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.state.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.state.error).toBeNull();
  });

  it('should add and remove visibility change listener', () => {
    const { unmount } = renderHook(() => useNotifications());

    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
  });
});
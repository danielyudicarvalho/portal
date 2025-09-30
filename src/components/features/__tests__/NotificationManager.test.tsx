import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationManager } from '../NotificationManager';
import { useNotifications } from '@/hooks/useNotifications';

// Mock the useNotifications hook
jest.mock('@/hooks/useNotifications');

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

const defaultMockState = {
  isSupported: true,
  permission: 'default' as NotificationPermission,
  isSubscribed: false,
  isLoading: false,
  error: null,
};

const defaultMockActions = {
  requestPermission: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  sendNotification: jest.fn(),
  notifyNewGame: jest.fn(),
  clearError: jest.fn(),
};

describe('NotificationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseNotifications.mockReturnValue({
      state: defaultMockState,
      ...defaultMockActions,
    });
  });

  it('should render notification manager with default state', () => {
    render(<NotificationManager />);
    
    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    expect(screen.getByText('Notification permission not requested')).toBeInTheDocument();
    expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
  });

  it('should show not supported message when notifications are not supported', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, isSupported: false },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    expect(screen.getByText('Notifications Not Supported')).toBeInTheDocument();
    expect(screen.getByText("Your browser doesn't support push notifications.")).toBeInTheDocument();
  });

  it('should show granted permission status', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'granted' },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    expect(screen.getByText('Notifications are enabled')).toBeInTheDocument();
  });

  it('should show denied permission status', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'denied' },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    expect(screen.getByText('Notifications are blocked')).toBeInTheDocument();
    expect(screen.getByText('Notifications are blocked. To enable them:')).toBeInTheDocument();
  });

  it('should display error message', () => {
    const errorMessage = 'Test error message';
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, error: errorMessage },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should clear error when close button is clicked', () => {
    const mockClearError = jest.fn();
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, error: 'Test error' },
      ...defaultMockActions,
      clearError: mockClearError,
    });

    render(<NotificationManager />);
    
    const closeButton = screen.getByLabelText('Clear error');
    fireEvent.click(closeButton);
    
    expect(mockClearError).toHaveBeenCalled();
  });

  it('should request permission when enable button is clicked', async () => {
    const mockRequestPermission = jest.fn();
    mockUseNotifications.mockReturnValue({
      state: defaultMockState,
      ...defaultMockActions,
      requestPermission: mockRequestPermission,
    });

    render(<NotificationManager />);
    
    const enableButton = screen.getByText('Enable Notifications');
    fireEvent.click(enableButton);
    
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('should show subscribe button when permission is granted but not subscribed', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'granted', isSubscribed: false },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    expect(screen.getByText('Subscribe to Notifications')).toBeInTheDocument();
  });

  it('should subscribe when subscribe button is clicked', async () => {
    const mockSubscribe = jest.fn();
    const vapidKey = 'test-vapid-key';
    
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'granted', isSubscribed: false },
      ...defaultMockActions,
      subscribe: mockSubscribe,
    });

    render(<NotificationManager vapidPublicKey={vapidKey} />);
    
    const subscribeButton = screen.getByText('Subscribe to Notifications');
    fireEvent.click(subscribeButton);
    
    expect(mockSubscribe).toHaveBeenCalledWith(vapidKey);
  });

  it('should show unsubscribe and test buttons when subscribed', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'granted', isSubscribed: true },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    expect(screen.getByText('Unsubscribe')).toBeInTheDocument();
    expect(screen.getByText('Send Test Notification')).toBeInTheDocument();
  });

  it('should unsubscribe when unsubscribe button is clicked', async () => {
    const mockUnsubscribe = jest.fn();
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'granted', isSubscribed: true },
      ...defaultMockActions,
      unsubscribe: mockUnsubscribe,
    });

    render(<NotificationManager />);
    
    const unsubscribeButton = screen.getByText('Unsubscribe');
    fireEvent.click(unsubscribeButton);
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should send test notification when test button is clicked', async () => {
    const mockSendNotification = jest.fn();
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'granted', isSubscribed: true },
      ...defaultMockActions,
      sendNotification: mockSendNotification,
    });

    render(<NotificationManager />);
    
    const testButton = screen.getByText('Send Test Notification');
    fireEvent.click(testButton);
    
    expect(mockSendNotification).toHaveBeenCalledWith({
      title: 'Test Notification',
      body: 'This is a test notification from the Game Portal!',
      icon: '/icons/icon-192x192.png',
      tag: 'test-notification',
    });
  });

  it('should show loading state', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, isLoading: true },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    expect(screen.getByText('Requesting...')).toBeInTheDocument();
  });

  it('should show loading state for subscription', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'granted', isSubscribed: false, isLoading: true },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    expect(screen.getByText('Subscribing...')).toBeInTheDocument();
  });

  it('should show loading state for unsubscription', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'granted', isSubscribed: true, isLoading: true },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    expect(screen.getByText('Unsubscribing...')).toBeInTheDocument();
  });

  it('should show notification stats when showStats is true', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, permission: 'granted', isSubscribed: true },
      ...defaultMockActions,
    });

    render(<NotificationManager showStats={true} />);
    
    expect(screen.getByText('Notification Status')).toBeInTheDocument();
    expect(screen.getByText('Supported:')).toBeInTheDocument();
    expect(screen.getByText('Permission:')).toBeInTheDocument();
    expect(screen.getByText('Subscribed:')).toBeInTheDocument();
    expect(screen.getByText('Loading:')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const customClass = 'custom-notification-manager';
    const { container } = render(<NotificationManager className={customClass} />);
    
    expect(container.firstChild).toHaveClass(customClass);
  });

  it('should disable buttons when loading', () => {
    mockUseNotifications.mockReturnValue({
      state: { ...defaultMockState, isLoading: true },
      ...defaultMockActions,
    });

    render(<NotificationManager />);
    
    const enableButton = screen.getByText('Requesting...');
    expect(enableButton).toBeDisabled();
  });
});
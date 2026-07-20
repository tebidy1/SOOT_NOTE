/**
 * Notification Service - Centralized service for managing user notifications.
 * This service is the single entry point for displaying all toast notifications.
 * It uses 'sonner' as the underlying library.
 *
 * IMPORTANT: Do NOT use the `toast` function from 'sonner' directly in other files.
 * Always use the exported functions from this service.
 */
import { toast } from 'sonner';
import type { ExternalToast } from 'sonner';

// --- Type Definitions ---

interface NotificationHistoryItem {
  message: string;
  timestamp: number;
}

interface ApiResponse<T = any> {
  status: boolean;
  code: number;
  message?: string;
  payload?: T;
  errors?: Record<string, string[]>;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface HandleApiOptions {
  showSuccess?: boolean;
  successMessage?: string;
  showError?: boolean;
  errorMessage?: string;
}

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

// --- Service Configuration ---

/**
 * Default toast configuration for Sonner.
 * Note: `position` and `theme` should be set on the global `<Toaster />` component.
 */
let defaultConfig: ExternalToast = {
  duration: 4000,
};

// --- Deduplication Logic ---

const notificationHistory: NotificationHistoryItem[] = [];
const NOTIFICATION_DEBOUNCE_TIME = 3000; // 3 seconds

/**
 * Checks if a similar notification has been shown recently.
 * @param message - The message to check.
 * @returns true if it is a recent duplicate.
 */
const isDuplicateNotification = (message: string): boolean => {
  const now = Date.now();
  // Clean up old notifications from history
  while (
    notificationHistory.length > 0 &&
    now - notificationHistory[0].timestamp > NOTIFICATION_DEBOUNCE_TIME
  ) {
    notificationHistory.shift();
  }

  // Check if a similar message exists
  return notificationHistory.some(item => item.message === message);
};

/**
 * Records a notification in the history.
 * @param message - The message that was shown.
 */
const recordNotification = (message: string): void => {
  notificationHistory.push({
    message,
    timestamp: Date.now(),
  });
};

// --- Core Notification Logic ---

/**
 * Internal function to display notifications.
 * @param message - The message to display.
 * @param type - The type of notification.
 * @param config - Additional Sonner toast configuration.
 */
const showNotification = (
  message: string,
  type: NotificationType,
  config: ExternalToast = {}
): void => {
  if (!message || isDuplicateNotification(message)) {
    return;
  }
  recordNotification(message);

  const toastConfig: ExternalToast = { ...defaultConfig, ...config };
  
  const toastFunction = {
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    default: toast,
  }[type];

  toastFunction(message, toastConfig);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[NotificationService:${type.toUpperCase()}]`, message);
  }
};

// --- Public API ---

export const showSuccess = (message: string, config: ExternalToast = {}): void => {
  showNotification(message, 'success', config);
};

export const showError = (message: string, config: ExternalToast = {}): void => {
  showNotification(message, 'error', config);
};

export const showWarning = (message: string, config: ExternalToast = {}): void => {
  showNotification(message, 'warning', config);
};

export const showInfo = (message: string, config: ExternalToast = {}): void => {
  showNotification(message, 'info', config);
};

/**
 * Handles an API response and shows an appropriate notification.
 * @param response - The API response object.
 * @param options - Additional options.
 * @returns The payload from the response.
 */
export const handleApiResponse = <T>(
  response: ApiResponse<T>,
  options: HandleApiOptions = {}
): T | undefined => {
  const { showSuccess: shouldShowSuccess = true, successMessage } = options;

  if (response.status === true) {
    if (response.message && shouldShowSuccess) {
      showSuccess(successMessage || response.message);
    }
    return response.payload;
  }
  return undefined;
};

/**
 * Handles an API error and shows an appropriate notification.
 * @param error - The API error object.
 * @param options - Additional options.
 */
export const handleApiError = (
  error: ApiError,
  options: HandleApiOptions = {}
): void => {
  const { showError: shouldShowError = true, errorMessage } = options;

  if (shouldShowError) {
    const message =
      error.response?.data?.message ||
      errorMessage ||
      '';
    if (message) {
      showError(message);
    }
  }

  // Rethrow the error for further handling if needed by the caller
  throw error;
};

/**
 * Sets the global default configuration for all notifications.
 * @param config - Global toast configuration.
 */
export const configureNotifications = (config: ExternalToast = {}): void => {
  if (config.position || (config as any).theme) {
    console.warn(
      'NotificationService: "position" and "theme" must be set globally on the <Toaster /> component, not via configureNotifications.'
    );
  }
  defaultConfig = { ...defaultConfig, ...config };
};

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  handleApiResponse,
  handleApiError,
  configureNotifications,
}; 
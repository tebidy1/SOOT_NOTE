export class ApiError extends Error {
  public readonly status: number;
  public readonly errors: Record<string, string[]>;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;
  public readonly originalError?: Error;
  public readonly responseData?: any;
  public readonly validationMessage?: string;

  constructor(
    status: number,
    message: string,
    errors: Record<string, string[]> = {},
    options: {
      isNetworkError?: boolean;
      isTimeout?: boolean;
      originalError?: Error;
      responseData?: any;
      validationMessage?: string;
    } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.isNetworkError = options.isNetworkError ?? false;
    this.isTimeout = options.isTimeout ?? false;
    this.originalError = options.originalError;
    this.responseData = options.responseData;
    this.validationMessage = options.validationMessage;

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromAxiosError(error: any): ApiError {
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return new ApiError(0, '', {}, { isTimeout: true, originalError: error });
      }
      
      const errorMessage = error.code === 'ERR_NETWORK' 
        ? ''
        : error.message || '';
      
      return new ApiError(0, errorMessage, {}, { isNetworkError: true, originalError: error });
    }

    const { status, data } = error.response;
    const message = data?.message || '';
    const errors = data?.errors || {};
    const validationMessage = status === 422 && data?.message ? data.message : undefined;

    return new ApiError(status, message, errors, { 
      originalError: error,
      responseData: data,
      validationMessage
    });
  }

  private static getDefaultMessageForStatus(status: number): string | null {
    return null;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isValidationError(): boolean {
    return this.status === 422;
  }

  hasValidationMessage(): boolean {
    return !!this.validationMessage;
  }

  getValidationMessage(): string | undefined {
    return this.validationMessage;
  }

  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  getFirstError(): string | null {
    const keys = Object.keys(this.errors);
    if (keys.length === 0) return null;
    return this.errors[keys[0]][0] || null;
  }

  getAllErrors(): string[] {
    return Object.values(this.errors).flat();
  }

  getFieldError(fieldName: string): string | null {
    const fieldErrors = this.errors?.[fieldName];
    if (!fieldErrors) return null;
    return Array.isArray(fieldErrors) ? (fieldErrors[0] || null) : fieldErrors;
  }
}

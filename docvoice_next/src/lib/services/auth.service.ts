import { baseApi } from './base.service';

const AUTH_PATH = 'admin/auth';

export const authService = {
  async login(email: string, password: string) {
    const response = await baseApi.post(`/${AUTH_PATH}/login`, {
      email: email,
      password,
    });

    return response;
  },

  async logout() {
    try {
      const response = await baseApi.post(`/${AUTH_PATH}/logout`);
      return response;
    } finally {
      baseApi.clearAuthToken();
    }
  },

  async getCurrentUser() {
    return baseApi.get(`/user/me`);
  },

  async changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string) {
    return baseApi.post(`/${AUTH_PATH}/change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    });
  },

  async sendOtp(phoneNumber: string) {
    return baseApi.post(`/${AUTH_PATH}/send-otp`, {
      phone_number: phoneNumber,
    });
  },

  async verifyOtp(phoneNumber: string, otp: string) {
    const response = await baseApi.post(`/${AUTH_PATH}/verify-otp`, {
      phone_number: phoneNumber,
      otp,
    });

    if (response?.token) {
      baseApi.setAuthToken(response.token);
    }

    return response;
  },

  async forgotPassword(phoneNumber: string) {
    return baseApi.post(`/${AUTH_PATH}/forgot-password`, {
      phone_number: phoneNumber,
    });
  },

  async resetPassword(token: string, phoneNumber: string, password: string, passwordConfirmation: string) {
    return baseApi.post(`/${AUTH_PATH}/reset-password`, {
      token,
      phone_number: phoneNumber,
      password,
      password_confirmation: passwordConfirmation,
    });
  },

  async refreshToken() {
    const response = await baseApi.post(`/${AUTH_PATH}/refresh`);

    if (response?.token) {
      baseApi.setAuthToken(response.token);
    }

    return response;
  },

  setToken(token: string) {
    baseApi.setAuthToken(token);
  },

  clearToken() {
    baseApi.clearAuthToken();
  },

  getToken() {
    return baseApi.getAuthToken();
  },

  isAuthenticated() {
    return !!baseApi.getAuthToken();
  },

  async register(name: string, email: string, phoneNumber: string, password: string) {
    const response = await baseApi.post(`/${AUTH_PATH}/register`, {
      name,
      email,
      phone_number: phoneNumber,
      password,
      password_confirmation: password,
    });

    return response;
  },

  async getSessions() {
    return baseApi.get(`/${AUTH_PATH}/sessions`);
  },

  async revokeSession(tokenId: number) {
    return baseApi.delete(`/${AUTH_PATH}/sessions/${tokenId}`);
  },

  async revokeAllSessions() {
    return baseApi.post(`/${AUTH_PATH}/sessions/revoke-all`);
  },

  async getTwoFactorStatus() {
    return baseApi.get(`/${AUTH_PATH}/two-factor`);
  },

  async enableTwoFactor() {
    return baseApi.post(`/${AUTH_PATH}/two-factor/enable`);
  },

  async disableTwoFactor() {
    return baseApi.post(`/${AUTH_PATH}/two-factor/disable`);
  },
};

export default authService;

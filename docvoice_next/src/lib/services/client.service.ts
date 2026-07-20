import { baseApi } from '@/lib/api/base-api';

const CLIENT_AUTH_PATH = 'clients/auth';
const login_PATH = 'auth';

export const clientService = {
    async login(email: string, password: string) {
        const instance = baseApi.getAxiosInstance();
        const response = await instance.post(`/${login_PATH}/login`, {
            email: email,
            password,
        });

        const data = response.data;

        if (data?.token) {
            baseApi.setAuthToken(data.token);
        }

        return data;
    },

    async sendOtp(phoneNumber: string) {
        return baseApi.post(`/${CLIENT_AUTH_PATH}/send-otp`, {
            phone_number: phoneNumber,
        });
    },

    async verifyOtp(phoneNumber: string, otp: string) {
        const response = await baseApi.post(`/${CLIENT_AUTH_PATH}/verify-otp`, {
            phone_number: phoneNumber,
            otp,
        });

        if (response?.token) {
            baseApi.setAuthToken(response.token);
        }

        return response;
    },

    async logout() {
        try {
            await baseApi.post(`/${CLIENT_AUTH_PATH}/logout`);
        } catch {
            // Backend logout endpoint may not exist; clear token locally
        } finally {
            baseApi.clearAuthToken();
        }
    },

    async getCurrentUser() {
        return baseApi.get(`/user`);
    },

    async completeProfile(data: { name: string; email?: string }) {
        return baseApi.post(`/${CLIENT_AUTH_PATH}/complete-profile`, data);
    },

    async updateProfile(data: { name?: string; email?: string; phone?: string; avatar?: File | null; notifications?: { sms: boolean; email: boolean } }) {
        const formData = new FormData();

        if (data.name !== undefined) {
            formData.append('name', data.name);
        }
        if (data.email !== undefined) {
            formData.append('email', data.email);
        }
        if (data.phone !== undefined) {
            formData.append('phone', data.phone);
        }
        if (data.avatar instanceof File) {
            formData.append('avatar', data.avatar);
        }
        if (data.notifications !== undefined) {
            formData.append('notifications', JSON.stringify(data.notifications));
        }

        return baseApi.post(`/${CLIENT_AUTH_PATH}/update-profile`, formData);
    },

    async changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string) {
        return baseApi.post(`/${CLIENT_AUTH_PATH}/change-password`, {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: newPasswordConfirmation,
        });
    },

    async forgotPassword(phoneNumber: string) {
        return baseApi.post(`/${CLIENT_AUTH_PATH}/forgot-password`, {
            phone_number: phoneNumber,
        });
    },

    async resetPassword(token: string, phoneNumber: string, password: string, passwordConfirmation: string) {
        return baseApi.post(`/${CLIENT_AUTH_PATH}/reset-password`, {
            token,
            phone_number: phoneNumber,
            password,
            password_confirmation: passwordConfirmation,
        });
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
};

export default clientService;
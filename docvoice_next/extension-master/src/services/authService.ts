import { apiClient } from './apiClient'
import { useAuthStore } from '../store/authStore'
import { User, LoginCredentials } from '../types/user'
import { ApiResponse, LoginResponse } from '../types/api'

class AuthService {
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      useAuthStore.getState().setLoading(true)
      useAuthStore.getState().setError(null)

      const response = await apiClient.login(credentials.email, credentials.password)

      if (response.success && response.data) {
        const { user, token } = response.data
        
        const userData: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'member',
          department: user.medical_department_id?.toString() || user.department || '',
          companyId: user.company_id,
          profileImage: user.profile_image_url || user.avatar || user.profileImage,
          phone: user.phone,
          status: user.status,
          company: user.company
        }

        useAuthStore.getState().login(userData, token)
        
        await this.saveToChromeStorage(userData, token)
        
        return true
      } else {
        useAuthStore.getState().setError(response.error || 'Login failed')
        return false
      }
    } catch (error: any) {
      useAuthStore.getState().setError(error.message || 'An error occurred')
      return false
    } finally {
      useAuthStore.getState().setLoading(false)
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      useAuthStore.getState().logout()
      await this.clearChromeStorage()
    }
  }

  async initializeFromStorage(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['authToken', 'user'])
      
      if (result.authToken && result.user) {
        useAuthStore.getState().login(result.user, result.authToken)
      }
    } catch (error) {
      console.error('Failed to initialize from storage:', error)
    }
  }

  async saveToChromeStorage(user: User, token: string): Promise<void> {
    try {
      await chrome.storage.local.set({
        authToken: token,
        user: user
      })
    } catch (error) {
      console.error('Failed to save to chrome storage:', error)
    }
  }

  async clearChromeStorage(): Promise<void> {
    try {
      await chrome.storage.local.remove(['authToken', 'user'])
    } catch (error) {
      console.error('Failed to clear chrome storage:', error)
    }
  }

  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated
  }

  getCurrentUser(): User | null {
    return useAuthStore.getState().user
  }

  getToken(): string | null {
    return useAuthStore.getState().token
  }
}

export const authService = new AuthService()
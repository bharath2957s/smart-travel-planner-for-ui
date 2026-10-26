/**
 * Smart AI Travel Planner 3.0
 * Authentication & User Profile Type Definitions
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  tier: 'explorer' | 'premium' | 'concierge';
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile?: (name: string) => Promise<boolean>;
}

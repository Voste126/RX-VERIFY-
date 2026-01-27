import { api } from './api';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
}

export interface PatientRegisterData extends RegisterData {
    // Patient-specific fields (can be extended)
}

export interface PharmacistRegisterData extends RegisterData {
    license_number?: string;
    pharmacy_name?: string;
    pharmacy_phone?: string;
}

export interface DistributorRegisterData extends RegisterData {
    company_name?: string;
    license_number?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'Patient' | 'Pharmacist' | 'Distributor' | 'Admin';
    first_name: string;
    last_name: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post('/auth/token/', credentials);
        const { access, refresh, user } = response.data;

        // Store tokens and user info
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(user));

        return { access, refresh, user };
    },

    async registerPatient(data: PatientRegisterData): Promise<{ message: string; user: User }> {
        const response = await api.post('/auth/register/patient/', data);
        return response.data;
    },

    async registerPharmacist(data: PharmacistRegisterData): Promise<{ message: string; user: User }> {
        const response = await api.post('/auth/register/pharmacist/', data);
        return response.data;
    },

    async registerDistributor(data: DistributorRegisterData): Promise<{ message: string; user: User }> {
        const response = await api.post('/auth/register/distributor/', data);
        return response.data;
    },

    async logout(): Promise<void> {
        const refreshToken = localStorage.getItem('refresh_token');
        try {
            await api.post('/auth/logout/', { refresh_token: refreshToken });
        } finally {
            // Clear local storage regardless of API response
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        }
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    },

    getRole(): string | null {
        const user = this.getCurrentUser();
        return user?.role || null;
    },
};

export default authService;

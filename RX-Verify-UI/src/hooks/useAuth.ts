import { authService } from '../services/auth';

export const useAuth = () => {
    const user = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    const isLoading = false;

    return { user, isAuthenticated, isLoading };
};

import { useState } from 'react';
import { authService } from '../services/auth';
import type { User } from '../services/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(authService.getCurrentUser());
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
    const [isLoading, setIsLoading] = useState<boolean>(false);

    return { user, isAuthenticated, isLoading };
};

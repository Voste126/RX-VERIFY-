// Dummy implementation of useAuth hook to prevent compilation errors
// In a real app, this should attach to your context provider
export const useAuth = () => {
    return {
        user: { role: 'Distributor' },
        isAuthenticated: true,
        isLoading: false
    };
};

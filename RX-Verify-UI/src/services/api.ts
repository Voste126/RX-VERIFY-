import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
    },
});

// ── Request interceptor — attach access token (skip public endpoints) ─────────
api.interceptors.request.use(
    (config) => {
        const publicEndpoints = ['/auth/register/', '/auth/token/', '/verify_qr/'];
        const isPublicEndpoint = publicEndpoints.some(ep => config.url?.includes(ep));
        if (!isPublicEndpoint) {
            const token = localStorage.getItem('access_token');
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Safely extract a human-readable string from a backend 400 `details` object.
 * Never leaks raw arrays, JSON blobs, or stack traces to the UI.
 */
function parse400Details(data: Record<string, unknown>): string {
    const details = (data?.details ?? data) as Record<string, unknown>;
    if (!details || typeof details !== 'object') return '';

    return Object.entries(details)
        .map(([field, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
            return (field === 'non_field_errors' || field === 'error')
                ? String(msg)
                : `${field}: ${msg}`;
        })
        .filter(Boolean)
        .join(' | ');
}

// ── Response interceptor — sanitize all errors before they reach components ───
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as typeof error.config & { _retry?: boolean };
        const httpStatus = error.response?.status;
        const data = error.response?.data as Record<string, unknown> | undefined;

        // ── 401: Try token refresh first; sanitize only if refresh also fails ──
        // Skip refresh if the failing request IS an auth endpoint (e.g. login with bad
        // credentials returns 401 — refreshing a null/stale token would just add a
        // spurious 400 to the logs).
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
        if (httpStatus === 401 && !originalRequest?._retry && !isAuthEndpoint) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                const resp = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                    refresh: refreshToken,
                });
                const { access } = resp.data as { access: string };
                localStorage.setItem('access_token', access);
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                }
                return api(originalRequest);
            } catch {
                // Refresh failed — clear session, redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/';
                return Promise.reject(new Error('Your session has expired. Please log in again.'));
            }
        }

        // ── Status-based sanitization switch ───────────────────────────────────
        let safeMessage: string;

        if (httpStatus !== undefined && httpStatus >= 500) {
            // Never expose server internals — secondary client-side defence
            safeMessage = 'System temporarily unavailable. Please try again later.';
        } else if (httpStatus === 401) {
            safeMessage = 'Your session has expired. Please log in again.';
        } else if (httpStatus === 403) {
            safeMessage = (data?.error as string) || 'You do not have permission to perform this action.';
        } else if (httpStatus === 404) {
            safeMessage = (data?.error as string) || 'The requested resource was not found.';
        } else if (httpStatus === 429) {
            safeMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (httpStatus === 400) {
            const topError = data?.error as string | undefined;
            const fieldErrors = parse400Details(data ?? {});
            safeMessage = topError
                ? (fieldErrors ? `${topError} — ${fieldErrors}` : topError)
                : (fieldErrors || 'The request data was invalid.');
        } else {
            safeMessage = 'An unexpected error occurred. Please try again.';
        }

        return Promise.reject(new Error(safeMessage));
    }
);

export default api;

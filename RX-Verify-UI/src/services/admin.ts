/**
 * Admin API Service
 * All endpoints accessible to an Admin role.
 */
import { api } from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
    id: string | number;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    date_joined: string;
    first_name?: string;
    last_name?: string;
}

export interface AdminCrowdFlag {
    id: string;
    lot: string;
    lot_batch_number: string;
    issue_type: string;
    reporter_type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    user: string;
    user_username: string;
    created_at: string;
    is_resolved: boolean;
}

export interface AdminManifest {
    id: string;
    batch_number: string;
    expiry_date: string;
    trust_score: string;
    digital_signature: string;
    medicine?: string;
    distributor?: string;
}

export interface AdminMedicine {
    id: string | number;
    name: string;
    active_ingredient: string;
    strength: string;
    dosage_form: string;
}

export interface AdminDistributor {
    id: string | number;
    name: string;
    license_number?: string;
    public_key: string;
}

export interface AdminReceiptEvent {
    id: string | number;
    lot?: string;
    lot_batch_number?: string;
    user_username?: string;
    user?: string;
    created_at: string;
    location_coord?: { lat: number; lng: number };
}

export interface AdminOrder {
    id: string;
    pharmacist: string;
    pharmacist_name: string;
    pharmacist_pharmacy?: string;
    distributor: string;
    distributor_name: string;
    items: Array<{ medicine_id: string; name?: string; quantity: number }>;
    status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'REJECTED';
    manifest?: string;
    manifest_batch?: string;
    manifest_trust_score?: string;
    delivery_token?: string;
    created_at: string;
    updated_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const extractList = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    const obj = data as { results?: T[] } | null;
    return obj?.results ?? [];
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const fetchAllUsers = async (): Promise<AdminUser[]> => {
    const res = await api.get('/users/');
    return extractList<AdminUser>(res.data);
};

// ── Flags ─────────────────────────────────────────────────────────────────────

export const fetchAllFlags = async (): Promise<AdminCrowdFlag[]> => {
    const res = await api.get('/flags/');
    return extractList<AdminCrowdFlag>(res.data);
};

export const resolveFlag = async (id: string): Promise<void> => {
    await api.post(`/flags/${id}/resolve/`);
};

export const unresolveFlag = async (id: string): Promise<void> => {
    await api.post(`/flags/${id}/unresolve/`);
};

// ── Manifests ─────────────────────────────────────────────────────────────────

export const fetchAllManifests = async (): Promise<AdminManifest[]> => {
    const res = await api.get('/manifests/');
    return extractList<AdminManifest>(res.data);
};

// ── Medicines ─────────────────────────────────────────────────────────────────

export const fetchAllMedicines = async (): Promise<AdminMedicine[]> => {
    const res = await api.get('/medicines/');
    return extractList<AdminMedicine>(res.data);
};

// ── Distributors ──────────────────────────────────────────────────────────────

export const fetchAllDistributors = async (): Promise<AdminDistributor[]> => {
    const res = await api.get('/distributors/');
    return extractList<AdminDistributor>(res.data);
};

// ── Receipt Events ─────────────────────────────────────────────────────────────
// Note: /receipts/ uses IsPharmacist permission — returns empty if user is Admin.
// Admin can still query the endpoint; if backend returns 403 we catch gracefully.

export const fetchAllReceipts = async (): Promise<AdminReceiptEvent[]> => {
    try {
        const res = await api.get('/receipts/');
        return extractList<AdminReceiptEvent>(res.data);
    } catch {
        return [];
    }
};

// ── Supply Orders (mounted at /api/orders/) ───────────────────────────────────

export const fetchAllOrders = async (): Promise<AdminOrder[]> => {
    const res = await api.get('/orders/');
    return extractList<AdminOrder>(res.data);
};

export const updateOrderStatus = async (
    id: string,
    status: AdminOrder['status']
): Promise<AdminOrder> => {
    const res = await api.patch<AdminOrder>(`/orders/${id}/`, { status });
    return res.data;
};

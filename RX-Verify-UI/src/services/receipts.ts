import { api } from './api';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface ReceiptEvent {
    id: string;
    location_coord: { lat: number; lng: number } | null;
    user: string;
    user_username: string;
    lot: string;
    lot_batch_number: string;
    lot_medicine_name?: string;
    created_at: string;
}

export interface CreateReceiptEventRequest {
    lot: string;                     // LotManifest UUID
    location_coord?: { lat: number; lng: number };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all receipt events for the current pharmacist
 */
export const getReceiptEvents = async (): Promise<ReceiptEvent[]> => {
    const response = await api.get<{ results: ReceiptEvent[] } | ReceiptEvent[]>('/receipts/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
};

/**
 * Create a new receipt event (called automatically after verify_receipt succeeds)
 */
export const createReceiptEvent = async (
    data: CreateReceiptEventRequest
): Promise<ReceiptEvent> => {
    const response = await api.post<ReceiptEvent>('/receipts/', data);
    return response.data;
};

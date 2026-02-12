import api from './api';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface OrderItem {
    medicine_id: string;
    name?: string;
    quantity: number;
}

export interface SupplyOrder {
    id: string;
    pharmacist: string;
    pharmacist_name: string;
    pharmacist_pharmacy?: string;
    distributor: string;
    distributor_name: string;
    items: OrderItem[];
    status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'REJECTED';
    manifest?: string | null;
    manifest_batch?: string | null;
    manifest_trust_score?: string | null;
    delivery_token: string;
    created_at: string;
    updated_at: string;
}

export interface OrderRequest {
    distributor: string;
    items: OrderItem[];
}

export interface FulfillOrderRequest {
    // Option 1: Select existing manifest
    manifest_id?: string;

    // Option 2: Create new manifest (required if manifest_id not provided)
    medicine_id?: string;
    batch_number?: string;
    expiry_date?: string;
}

export interface FulfillOrderResponse {
    success: boolean;
    message: string;
    qr_data: string;
    batch_number: string;
    trust_score: string;
    order_status: string;
}

export interface ManifestDetails {
    manifest_id: string;
    batch_number: string;
    expiry_date: string;
    digital_signature: string;
    qr_code_content: string;
    trust_score: string;
    medicine_name: string;
}

export interface VerifyReceiptRequest {
    scanned_uuid: string;
}

export interface VerifyReceiptResponse {
    status: 'VERIFIED' | 'INVALID';
    message: string;
    trust_score: string;
    base_score?: string;
    bonus_applied?: string;
    batch_number: string;
    expiry_date?: string;
    medicine_name: string;
    distributor_name: string;
    chain_of_custody: boolean;
    order_id?: string;
    warning?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new supply order (Pharmacist only)
 */
export const createOrder = async (data: OrderRequest): Promise<SupplyOrder> => {
    const response = await api.post<SupplyOrder>('/orders/', data);
    return response.data;
};

/**
 * Get orders for the current pharmacist
 */
export const getPharmacistOrders = async (): Promise<SupplyOrder[]> => {
    const response = await api.get<{ results: SupplyOrder[] } | SupplyOrder[]>('/orders/');
    // Handle both paginated and non-paginated responses
    return Array.isArray(response.data) ? response.data : response.data.results || [];
};

/**
 * Get incoming orders for the current distributor
 */
export const getDistributorOrders = async (): Promise<SupplyOrder[]> => {
    const response = await api.get<{ results: SupplyOrder[] } | SupplyOrder[]>('/orders/');
    // Handle both paginated and non-paginated responses
    return Array.isArray(response.data) ? response.data : response.data.results || [];
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (orderId: string): Promise<SupplyOrder> => {
    const response = await api.get<SupplyOrder>(`/orders/${orderId}/`);
    return response.data;
};

/**
 * Fulfill an order (Distributor only)
 * Creates a lot manifest and links it to the order
 */
export const fulfillOrder = async (
    orderId: string,
    data: FulfillOrderRequest
): Promise<FulfillOrderResponse> => {
    const response = await api.post<FulfillOrderResponse>(
        `/orders/${orderId}/fulfill/`,
        data
    );
    return response.data;
};

/**
 * Get manifest details for an order (pharmacist - Digital Bill of Lading)
 */
export const getOrderManifest = async (orderId: string): Promise<ManifestDetails> => {
    const response = await api.get<ManifestDetails>(`/orders/${orderId}/manifest_details/`);
    return response.data;
};

/**
 * Verify receipt of an order (Pharmacist only)
 * Checks chain of custody and awards trust score bonus
 */
export const verifyReceipt = async (
    data: VerifyReceiptRequest
): Promise<VerifyReceiptResponse> => {
    const response = await api.post<VerifyReceiptResponse>(
        '/orders/verify_receipt/',
        data
    );
    return response.data;
};

/**
 * Update order status (Admin only)
 */
export const updateOrderStatus = async (
    orderId: string,
    status: SupplyOrder['status']
): Promise<SupplyOrder> => {
    const response = await api.patch<SupplyOrder>(`/orders/${orderId}/`, { status });
    return response.data;
};

export default {
    createOrder,
    getPharmacistOrders,
    getDistributorOrders,
    getOrderById,
    fulfillOrder,
    verifyReceipt,
    updateOrderStatus,
};

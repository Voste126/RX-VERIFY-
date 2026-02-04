import { api } from './api';

// TypeScript Interfaces
export interface Medicine {
    id: string;
    name: string;
    category: string;
    active_ingredient: string;
    strength: string;
    dosage_form: string;
    manufacturer_name: string;
    distributor: string;
}

export interface CreateMedicineData {
    name: string;
    category: string;
    active_ingredient: string;
    strength: string;
    dosage_form: string;
    manufacturer_name: string;
}

export interface LotManifest {
    id: string;
    batch_number: string;
    expiry_date: string;
    digital_signature: string;
    trust_score: string;
    medicine: string;
    distributor: string;
    medicine_details?: Medicine;
}

export interface CreateLotManifestData {
    batch_number: string;
    expiry_date: string;
    medicine: string;
}

export interface VerificationResponse {
    lot_id: string;
    batch_number: string;
    medicine_name: string;
    expiry_date: string;
    distributor: string;
    trust_score: string;
    status: 'Verified' | 'Forged/Tampered';
    timestamp: string;
}

// Distributor Entity (for cryptographic key management)
export interface DistributorEntity {
    id: string;
    name: string;
    public_key: string;
    private_key?: string; // Only returned on creation!
    is_verified_regulator: boolean;
}

export interface CreateDistributorEntityData {
    name: string;
    is_verified_regulator: boolean;
}

export const distributorService = {
    // Distributor Entity Management (Cryptographic Keys)
    async createDistributorEntity(data: CreateDistributorEntityData): Promise<DistributorEntity> {
        const response = await api.post('/distributors/', data);
        return response.data;
    },

    async getDistributorEntityById(id: string): Promise<DistributorEntity> {
        const response = await api.get(`/distributors/${id}/`);
        return response.data;
    },

    async getDistributorEntities(): Promise<DistributorEntity[]> {
        const response = await api.get('/distributors/');
        return response.data;
    },

    // Medicine APIs
    async createMedicine(data: CreateMedicineData): Promise<Medicine> {
        const response = await api.post('/medicines/', data);
        return response.data;
    },

    async getMedicines(filters?: { category?: string; search?: string }): Promise<Medicine[]> {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);

        const response = await api.get(`/medicines/?${params.toString()}`);
        return response.data;
    },

    async getMedicineById(id: string): Promise<Medicine> {
        const response = await api.get(`/medicines/${id}/`);
        return response.data;
    },

    async updateMedicine(id: string, data: Partial<CreateMedicineData>): Promise<Medicine> {
        const response = await api.patch(`/medicines/${id}/`, data);
        return response.data;
    },

    async deleteMedicine(id: string): Promise<void> {
        await api.delete(`/medicines/${id}/`);
    },

    // Lot Manifest APIs
    async createLotManifest(data: CreateLotManifestData): Promise<LotManifest> {
        const response = await api.post('/manifests/', data);
        return response.data;
    },

    async getLotManifests(filters?: {
        medicine?: string;
        distributor?: string;
        min_trust_score?: number;
    }): Promise<LotManifest[]> {
        const params = new URLSearchParams();
        if (filters?.medicine) params.append('medicine', filters.medicine);
        if (filters?.distributor) params.append('distributor', filters.distributor);
        if (filters?.min_trust_score) params.append('min_trust_score', filters.min_trust_score.toString());

        const response = await api.get(`/manifests/?${params.toString()}`);
        return response.data;
    },

    async getLotManifestById(id: string): Promise<LotManifest> {
        const response = await api.get(`/manifests/${id}/`);
        return response.data;
    },

    async verifyLotManifest(id: string): Promise<VerificationResponse> {
        const response = await api.get(`/manifests/${id}/verify/`);
        return response.data;
    },

    async getManifestQRData(id: string): Promise<any> {
        const response = await api.get(`/manifests/${id}/verify_qr/`);
        return response.data;
    },
};

export default distributorService;

/**
 * Flags API service for the Patient Dashboard.
 *
 * Wraps the `/api/reports/flags/` endpoint with typed request/response shapes
 * that match the actual `CrowdFlagSerializer` on the backend.
 */
import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CrowdFlag {
    id: string;
    /** UUID of the LotManifest being flagged */
    lot: string;
    /** Batch number of the lot (read-only, from backend) */
    lot_batch_number: string;
    /** e.g. "Counterfeit Suspected", "Quality Issue", "Packaging Damage" */
    issue_type: string;
    /** e.g. "Patient", "Pharmacist" */
    reporter_type: string;
    severity: FlagSeverity;
    description: string;
    /** UUID of the reporting user (read-only) */
    user: string;
    /** Username of the reporting user (read-only) */
    user_username: string;
    latitude?: number;
    longitude?: number;
    region?: string;
    created_at: string;
    is_resolved: boolean;
}

export interface CreateFlagPayload {
    lot: string;
    severity: FlagSeverity;
    reporter_type: string;
    issue_type: string;
    description: string;
    latitude?: number;
    longitude?: number;
    region?: string;
}

export interface HeatmapPoint {
    id: string;
    latitude: number;
    longitude: number;
    severity: FlagSeverity;
    medicine_name: string;
}

// ─── API Base Path ─────────────────────────────────────────────────────────────

const FLAGS_URL = '/flags/';

// ─── Service Functions ─────────────────────────────────────────────────────────

/**
 * Fetch only the current authenticated user's own crowd flags.
 * Uses `?my_flags=true` query param so the backend filters by request.user.
 */
export async function fetchMyFlags(): Promise<CrowdFlag[]> {
    const res = await api.get<{ results?: CrowdFlag[] } | CrowdFlag[]>(
        `${FLAGS_URL}?my_flags=true`
    );
    const data = res.data;
    if (Array.isArray(data)) return data;
    return (data as { results?: CrowdFlag[] }).results ?? [];
}

/**
 * Submit a new crowd flag for a lot manifest.
 * The backend automatically sets `user = request.user`.
 */
export async function createFlag(payload: CreateFlagPayload): Promise<CrowdFlag> {
    const res = await api.post<CrowdFlag>(FLAGS_URL, payload);
    return res.data;
}

/**
 * Fetch lightweight coordinate data for the Fraud Radar Heatmap
 */
export async function getHeatmapData(): Promise<HeatmapPoint[]> {
    const res = await api.get<HeatmapPoint[]>(`${FLAGS_URL}heatmap_data/`);
    return res.data;
}

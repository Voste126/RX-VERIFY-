/**
 * Flags API service for the Patient Dashboard.
 *
 * Wraps the `/api/reports/flags/` endpoint with typed request/response shapes
 * that match the actual `CrowdFlagSerializer` on the backend.
 */
import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
    | 'NEW'
    | 'INVESTIGATING'
    | 'ESCALATED_DISTRIBUTOR'
    | 'ESCALATED_REGULATOR'
    | 'RESOLVED'
    | 'CLOSED_NO_ACTION';

export interface CrowdFlag {
    id: string;
    /** UUID of the LotManifest being flagged */
    lot: string;
    /** Batch number of the lot (read-only, from backend) */
    lot_batch_number: string;
    /** e.g. "COUNTERFEIT", "QUALITY", "PACKAGING", "ADVERSE_EVENT", "MISSING_MANIFEST" */
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
    /** Backward-compatible computed property */
    is_resolved: boolean;

    // ── Investigation Lifecycle fields ────────────────────────────────────
    status: IncidentStatus;
    dispensing_pharmacy_name?: string;
    date_of_purchase?: string;
    /** URL to the uploaded evidence image (read-only) */
    evidence_image?: string | null;
    investigator_notes?: string;
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
    dispensing_pharmacy_name?: string;
    date_of_purchase?: string;
    /** File object — sent via FormData */
    evidence_image?: File;
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
 * Submit a new crowd flag / incident report for a lot manifest.
 * Uses FormData to support image uploads.
 * The backend automatically sets `user = request.user`.
 */
export async function createFlag(payload: CreateFlagPayload): Promise<CrowdFlag> {
    const formData = new FormData();

    // Append all text fields
    formData.append('lot', payload.lot);
    formData.append('severity', payload.severity);
    formData.append('reporter_type', payload.reporter_type);
    formData.append('issue_type', payload.issue_type);
    formData.append('description', payload.description);

    if (payload.latitude !== undefined)  formData.append('latitude', String(payload.latitude));
    if (payload.longitude !== undefined) formData.append('longitude', String(payload.longitude));
    if (payload.region)                  formData.append('region', payload.region);
    if (payload.dispensing_pharmacy_name) formData.append('dispensing_pharmacy_name', payload.dispensing_pharmacy_name);
    if (payload.date_of_purchase)        formData.append('date_of_purchase', payload.date_of_purchase);

    // Append image file if provided
    if (payload.evidence_image) {
        formData.append('evidence_image', payload.evidence_image);
    }

    const res = await api.post<CrowdFlag>(FLAGS_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

/**
 * Fetch lightweight coordinate data for the Fraud Radar Heatmap
 */
export async function getHeatmapData(): Promise<HeatmapPoint[]> {
    const res = await api.get<HeatmapPoint[]>(`${FLAGS_URL}heatmap_data/`);
    return res.data;
}

// ─── Investigation Lifecycle Actions ───────────────────────────────────────────

/**
 * Transition a flag to INVESTIGATING status.
 */
export async function startInvestigation(id: string, notes: string): Promise<CrowdFlag> {
    const res = await api.post<CrowdFlag>(`${FLAGS_URL}${id}/start_investigation/`, { notes });
    return res.data;
}

/**
 * Escalate a flag to a Distributor or Regulator.
 * @param escalateTo — 'DISTRIBUTOR' | 'REGULATOR'
 */
export async function escalateFlag(
    id: string,
    escalateTo: 'DISTRIBUTOR' | 'REGULATOR',
    notes: string,
): Promise<CrowdFlag> {
    const res = await api.post<CrowdFlag>(`${FLAGS_URL}${id}/escalate/`, {
        escalate_to: escalateTo,
        notes,
    });
    return res.data;
}

/**
 * Mark a flag as RESOLVED with resolution notes.
 */
export async function resolveFlag(id: string, notes: string): Promise<CrowdFlag> {
    const res = await api.post<CrowdFlag>(`${FLAGS_URL}${id}/resolve/`, { notes });
    return res.data;
}

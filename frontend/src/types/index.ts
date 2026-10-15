export type UserRole = 'admin' | 'reviewer' | 'contractor' | 'viewer';
export type ProjectStatus = 'active' | 'completed' | 'archived';
export type PipelineStatus = 'planned' | 'draft' | 'pending_verification' | 'pending_review' | 'approved' | 'rejected' | 'needs_additional_evidence';
export type UtilityType = 'water' | 'gas' | 'sewage' | 'electrical' | 'telecom';
export type EvidenceType = 'video' | 'image' | 'document';
export type MeasurementMethod = 'gps' | 'total_station' | 'tape' | 'lidar' | 'photogrammetry' | 'unknown';
export type ReviewAction = 'created' | 'submitted' | 'approved' | 'rejected' | 'requested_changes' | 'commented';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  owner_id: number;
  crs: string;
  site_boundary: GeoJSON.GeoJsonObject | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineAsset {
  id: number;
  project_id: number;
  name: string;
  utility_type: UtilityType;
  material: string | null;
  diameter_mm: number | null;
  installation_date: string | null;
  status: PipelineStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineSegment {
  id: number;
  asset_id: number;
  segment_type: string;
  geometry_planned: GeoJSON.GeoJsonObject | null;
  geometry_draft: GeoJSON.GeoJsonObject | null;
  geometry_approved: GeoJSON.GeoJsonObject | null;
  geometry_crs: string;
  length_m: number | null;
  depth_m: number | null;
  depth_reference: string | null;
  depth_method: MeasurementMethod;
  depth_confidence: number | null;
  accuracy_m: number | null;
  source: string | null;
  version: number;
  status: PipelineStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceRecord {
  id: number;
  project_id: number;
  segment_id: number | null;
  capture_session_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  evidence_type: EvidenceType;
  sha256_hash: string;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  device_timestamp: string | null;
  server_timestamp: string;
  gnss_latitude: number | null;
  gnss_longitude: number | null;
  gnss_accuracy_m: number | null;
  gnss_altitude_m: number | null;
  metadata: Record<string, unknown> | null;
  is_verified: boolean;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedFrame {
  id: number;
  evidence_id: number;
  frame_number: number;
  timestamp_seconds: number;
  file_path: string;
  sha256_hash: string;
  width: number | null;
  height: number | null;
  gnss_latitude: number | null;
  gnss_longitude: number | null;
  gnss_accuracy_m: number | null;
  created_at: string;
}

export interface Measurement {
  id: number;
  segment_id: number;
  measurement_type: string;
  value: number;
  unit: string;
  reference_surface: string | null;
  datum: string | null;
  method: MeasurementMethod;
  accuracy: number | null;
  source: string | null;
  measured_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIObservation {
  id: number;
  segment_id: number;
  frame_id: number | null;
  model_name: string;
  model_version: string;
  detection_type: string;
  confidence: number;
  bounding_box: Record<string, unknown> | null;
  geometry: GeoJSON.GeoJsonObject | null;
  geometry_crs: string | null;
  is_manual: boolean;
  reviewed: boolean;
  reviewer_id: number | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RouteComparison {
  id: number;
  segment_id: number;
  deviation_max_m: number | null;
  deviation_mean_m: number | null;
  deviation_rms_m: number | null;
  length_planned_m: number | null;
  length_measured_m: number | null;
  length_difference_m: number | null;
  tolerance_m: number;
  status: string;
  warnings: string[] | null;
  compared_at: string;
}

export interface ReviewHistory {
  id: number;
  segment_id: number;
  user_id: number;
  action: ReviewAction;
  previous_status: PipelineStatus | null;
  new_status: PipelineStatus | null;
  comments: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
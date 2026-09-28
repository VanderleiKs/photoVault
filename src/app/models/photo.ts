export interface Photo {
  id: string;
  library_id: string;
  relative_path: string;
  filename: string;
  media_type: 'image' | 'video';
  file_size: number;
  width: number | null;
  height: number | null;
  captured_at: string | null;
  sha256: string | null;
  perceptual_hash: string | null;
  quality_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface Library {
  id: string;
  name: string;
  root_path: string;
  created_at: string;
  last_scan_at: string | null;
}

export interface LibraryStats {
  total_photos: number;
  total_videos: number;
  total_size: number;
}

export interface PhotoNavigation {
  prev_id: string | null;
  next_id: string | null;
}

export type ScanPhase = 'discovering' | 'indexing';

/** Payload of the `scan_progress` event. `total` is 0 while discovering. */
export interface ScanProgress {
  libraryId: string;
  phase: ScanPhase;
  processed: number;
  total: number;
  currentPath: string;
}

/** Payload of the `scan_complete` event. */
export interface ScanComplete {
  libraryId: string;
  totalProcessed: number;
  newFiles: number;
  modifiedFiles: number;
  errors: number;
  cancelled: boolean;
}

/** Payload of the `scan_error` event. */
export interface ScanError {
  libraryId: string;
  error: string;
}

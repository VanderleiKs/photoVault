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

export interface ScanProgress {
  processed: number;
  total: number;
  current_path?: string;
  currentPath?: string;
}

export interface ScanComplete {
  library_id: string;
  total_processed: number;
  new_files: number;
  modified_files: number;
  errors: number;
}

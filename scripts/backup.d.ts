export interface BackupResult {
  filename: string;
  path: string;
  sizeBytes: number;
}
export function runBackup(options?: { outputDir?: string }): Promise<BackupResult>;
import { registerPlugin } from '@capacitor/core'

export interface AuditExportResult {
  saved: boolean;
}

interface AuditExportPlugin {
  save(options: { content: string; fileName: string }): Promise<AuditExportResult>;
}

export const AuditExport = registerPlugin<AuditExportPlugin>('AuditExport')

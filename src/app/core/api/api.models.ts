/**
 * Tipos de la API.
 *
 * Se escriben a mano en lugar de generarse porque el backend no expone OpenAPI
 * todavia. Si algun dia lo hace, esto deberia generarse: una copia manual del
 * contrato se desincroniza en silencio, y el compilador de TypeScript no puede
 * avisar de un campo que el servidor renombro.
 */

export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
export type Severity = (typeof SEVERITIES)[number];

/** Espejo de ScanStatus del backend. */
export type ScanStatus = 'REQUESTED' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

/** Estados en los que un scan todavia no ha terminado. */
export const ACTIVE_SCAN_STATUSES: readonly ScanStatus[] = ['REQUESTED', 'QUEUED', 'RUNNING'];

/** Espejo de FindingStatus del backend. */
export type FindingStatus =
  'OPEN' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'ACCEPTED_RISK' | 'RESOLVED' | 'REGRESSED';

/** Decisiones que ofrece el dialogo de revision de un hallazgo abierto. */
export type ReviewDecision = Extract<
  FindingStatus,
  'FALSE_POSITIVE' | 'ACCEPTED_RISK' | 'CONFIRMED'
>;

/**
 * Decisiones que exigen nota. El backend las rechaza con 400 si falta: un
 * descarte sin justificacion es indistinguible de alguien silenciando un
 * problema.
 */
export const DECISIONS_REQUIRING_NOTE: readonly ReviewDecision[] = [
  'FALSE_POSITIVE',
  'ACCEPTED_RISK',
];

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface Repository {
  id: string;
  projectId: string;
  provider: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  visibility: string;
  authorized: boolean;
  authorizedAt: string | null;
  createdAt: string;
}

export interface ConnectRepositoryRequest {
  provider: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch?: string;
  visibility?: string;
}

export interface Scan {
  id: string;
  projectId: string;
  repositoryId: string | null;
  status: ScanStatus;
  triggerType: string;
  branch: string | null;
  commitSha: string | null;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  errorCode: string | null;
}

export interface ScoreCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}

export interface SecurityScore {
  scanId: string;
  score: number;
  grade: string;
  previousScore: number | null;
  delta: number | null;
  counts: ScoreCounts;
  newFindings: number;
  resolvedFindings: number;
  /** Desglose del calculo: por que este numero y no otro. */
  breakdown: Record<string, unknown>;
  algorithmVersion: string;
  calculatedAt: string;
}

export interface ScoreTrendPoint {
  score: number;
  grade: string;
  critical: number;
  high: number;
  newFindings: number;
  resolvedFindings: number;
  calculatedAt: string;
}

/** Una accion de remediacion, no un hallazgo. */
export interface RemediationGroup {
  remediationKey: string;
  title: string;
  severity: Severity;
  category: string;
  priority: number | null;
  /** Cuantos hallazgos cierra esta unica accion. */
  findingCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  maxCvss: number | null;
  packageName: string | null;
  installedVersion: string | null;
  /** Todas las versiones que corrigen algo del grupo, sin elegir una. */
  fixedVersions: string | null;
  filePath: string | null;
  recommendation: string | null;
  hasRegression: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Finding {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  description: string | null;
  recommendation: string | null;
  analyzer: string;
  ruleId: string | null;
  cwe: string | null;
  cve: string | null;
  cvssScore: number | null;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  /** Ya viene enmascarada: el worker nunca guarda un secreto completo. */
  evidence: string | null;
  packageName: string | null;
  installedVersion: string | null;
  fixedVersion: string | null;
  status: FindingStatus;
  validationState: string;
  priority: number | null;
  remediationKey: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface FindingFilters {
  severity?: Severity;
  category?: string;
  status?: FindingStatus;
}

export interface FindingPage {
  items: Finding[];
  total: number;
  page: number;
  size: number;
}

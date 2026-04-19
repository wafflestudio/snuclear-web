export interface CourseSyncRunRequest {
  year: number;
  semester: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';
}

export interface CourseSyncRunResponse {
  accepted: boolean;
  startedAt: string;
}

export interface LastRunInfo {
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  startedAt: string;
  finishedAt: string | null;
  year: number;
  semester: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';
  rowsUpserted: number | null;
  message: string | null;
}

export interface CourseSyncAutoStatusResponse {
  enabled: boolean;
  intervalMinutes: number;
  lastRun: LastRunInfo | null;
  updatedAt: string;
}

export type EnrollmentPeriodType = 'REGULAR' | 'FRESHMAN';

export interface EnrollmentPeriodResponse {
  type: EnrollmentPeriodType;
}

export interface EnrollmentPeriodUpdateRequest {
  type: EnrollmentPeriodType;
}

// SugangPeriod (수강신청 기간 크롤링) types
export interface SugangPeriodDto {
  category: string;
  date: string;
  time: string;
  remark: string;
}

export interface SugangPeriodResponse {
  header: string;
  body: SugangPeriodDto[];
}

export interface SugangPeriodSyncRunResponse {
  accepted: boolean;
  startedAt: string;
}

export interface SugangPeriodSyncLastRun {
  status: 'SUCCESS' | 'FAILED';
  startedAt: string;
  finishedAt: string;
  message: string | null;
  hasDumpData: boolean;
}

export interface SugangPeriodSyncStatusResponse {
  enabled: boolean;
  updatedAt: string;
  lastRun: SugangPeriodSyncLastRun | null;
}

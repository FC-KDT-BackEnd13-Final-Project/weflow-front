// Step API 관련 타입 정의

export enum StepStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export interface StepResponse {
  id: number;
  phase: string; // ProjectStatus
  title: string;
  description: string;
  orderIndex: number;
  status: StepStatus;
  projectId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface StepListResponse {
  totalCount: number;
  page: number;
  size: number;
  steps: StepResponse[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

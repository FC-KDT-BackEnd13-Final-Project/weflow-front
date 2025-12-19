import type { ProjectPhase } from "@/apis/adminProjects";

export type DefaultStage = {
  title: string;
  phase: ProjectPhase;
};

export const DEFAULT_STEPS: DefaultStage[] = [
  // CONTRACT
  { title: "계약", phase: "CONTRACT" },

  // IN_PROGRESS
  { title: "요구사항 정의", phase: "IN_PROGRESS" },
  { title: "화면 설계", phase: "IN_PROGRESS" },
  { title: "디자인", phase: "IN_PROGRESS" },
  { title: "퍼블리싱", phase: "IN_PROGRESS" },
  { title: "개발", phase: "IN_PROGRESS" },
  { title: "검수", phase: "IN_PROGRESS" },

  // DELIVERY
  { title: "납품", phase: "DELIVERY" },

  // MAINTENANCE
  { title: "유지보수", phase: "MAINTENANCE" },
];

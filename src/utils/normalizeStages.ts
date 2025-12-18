import type { StepResponse } from "@/apis/steps";
import type { ProjectPhase } from "@/apis/adminProjects";

type Stage = {
  key: string; // stable key for UI
  id?: number;
  name: string;
  phase: ProjectPhase;
  order: number;
};

const DEFAULT_SINGLE: Record<ProjectPhase, string> = {
  CONTRACT: "계약",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
};

const DEFAULT_IN_PROGRESS = [
  "요구사항 정의",
  "화면 설계",
  "디자인",
  "퍼블리싱",
  "개발",
  "검수",
];

export const normalizeStages = (apiSteps: StepResponse[]): Stage[] => {
  const result: Stage[] = [];

  // 1) 서버 step을 orderIndex 기준으로 그대로 사용
  const sorted = [...apiSteps].sort((a, b) => a.orderIndex - b.orderIndex);

  sorted.forEach((s) => {
    result.push({
      key: `step-${s.id}`,
      id: s.id,
      name: s.title,
      phase: (s.phase as ProjectPhase) ?? "IN_PROGRESS",
      order: result.length + 1,
    });
  });

  const hasPhase = (phase: ProjectPhase) =>
    result.some((s) => s.phase === phase);

  // CONTRACT / DELIVERY / MAINTENANCE : 없으면 단일 기본 추가
  (["CONTRACT", "DELIVERY", "MAINTENANCE"] as ProjectPhase[]).forEach(
    (phase) => {
      if (!hasPhase(phase)) {
        result.push({
          key: `default-${phase}`,
          name: DEFAULT_SINGLE[phase],
          phase,
          order: result.length + 1,
        });
      }
    }
  );

  // IN_PROGRESS : 없으면 6개 기본 추가
  if (!hasPhase("IN_PROGRESS")) {
    DEFAULT_IN_PROGRESS.forEach((title, idx) => {
      result.push({
        key: `default-IN_PROGRESS-${idx}`,
        name: title,
        phase: "IN_PROGRESS",
        order: result.length + 1,
      });
    });
  }

  return result;
};

export interface ProjectStep {
  id: number;
  name: string;
  orderIndex: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
  startDate: string;
  endDateExpected: string;
}

export const mockProjectSteps: ProjectStep[] = [
  {
    id: 21,
    name: "요구사항 정의",
    orderIndex: 1,
    status: "IN_PROGRESS",
    startDate: "2025-02-01",
    endDateExpected: "2025-02-10",
  },
  {
    id: 22,
    name: "화면 설계",
    orderIndex: 2,
    status: "NOT_STARTED",
    startDate: "2025-02-11",
    endDateExpected: "2025-02-20",
  },
  {
    id: 23,
    name: "디자인",
    orderIndex: 3,
    status: "NOT_STARTED",
    startDate: "2025-02-21",
    endDateExpected: "2025-03-05",
  },
  {
    id: 24,
    name: "개발",
    orderIndex: 4,
    status: "NOT_STARTED",
    startDate: "2025-03-06",
    endDateExpected: "2025-03-25",
  },
  {
    id: 25,
    name: "검수",
    orderIndex: 5,
    status: "NOT_STARTED",
    startDate: "2025-03-26",
    endDateExpected: "2025-04-05",
  },
];

export const projectStepMap = mockProjectSteps.reduce<Record<number, ProjectStep>>((acc, step) => {
  acc[step.id] = step;
  return acc;
}, {});

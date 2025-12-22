export type BoardPostStatus = "progress" | "complete";
export type BoardQuestionStatus = "waiting" | "answered";
export type BoardStatus = BoardPostStatus | BoardQuestionStatus;

export const boardStatusLabels: Record<BoardStatus, string> = {
  progress: "진행중",
  complete: "완료",
  waiting: "답변 대기",
  answered: "답변 완료",
};

export const boardStatusStyles: Record<BoardStatus, string> = {
  progress: "bg-blue-100 text-blue-700 border-blue-200",
  complete: "bg-green-100 text-green-700 border-green-200",
  waiting: "!bg-[#FFF0B8] !text-[#7A4F00] !border-[#FFD98D]",
  answered: "!bg-[#E5F7E9] !text-[#2E7D32] !border-[#BEEBC8]",
};

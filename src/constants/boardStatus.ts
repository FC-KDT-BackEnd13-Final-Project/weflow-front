export type BoardPostStatus = "progress" | "complete";
export type BoardApprovalStatus = "request" | "approved" | "rejected";
export type BoardStatus = BoardPostStatus | BoardApprovalStatus;

export const boardStatusLabels: Record<BoardStatus, string> = {
  progress: "진행중",
  complete: "완료",
  request: "승인 요청",
  approved: "승인",
  rejected: "반려",
};

export const boardStatusStyles: Record<BoardStatus, string> = {
  progress: "bg-blue-100 text-blue-700 border-blue-200",
  complete: "bg-green-100 text-green-700 border-green-200",
  request: "!bg-[#FFF0B8] !text-[#7A4F00] !border-[#FFD98D]",
  approved: "!bg-[#E5F7E9] !text-[#2E7D32] !border-[#BEEBC8]",
  rejected: "!bg-[#FFE5E5] !text-[#C12727] !border-[#FFB8B8]",
};

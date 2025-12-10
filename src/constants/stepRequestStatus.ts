export const stepRequestStatusMap: Record<
  string,
  { label: string; className: string }
> = {
  REQUESTED: { label: "승인 요청", className: "bg-amber-100 text-amber-700" },
  CHANGE_REQUESTED: { label: "수정 요청", className: "bg-orange-100 text-orange-700" },
  APPROVED: { label: "승인", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "반려", className: "bg-red-100 text-red-700" },
  CANCELED: { label: "요청 취소", className: "bg-slate-500 text-white" },
};

import { cn } from "@/lib/utils";

type StatusType =
  | "pending"
  | "progress"
  | "complete"
  | "rejected"
  | "approved"
  | "request";

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  pending: "bg-status-pending-bg text-status-pending",
  progress: "bg-status-progress-bg text-status-progress",
  complete: "bg-status-complete-bg text-status-complete",
  rejected: "bg-status-rejected-bg text-status-rejected",

  //질문 요청
  request: "bg-[#FFE899] text-[#7A4A00] border border-[#F5CA6A]",
  approved: "bg-[#D3F9D8] text-[#1B5E20] border border-[#A5E4AE]",
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "status-badge px-3 py-1 rounded-full text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {children}
    </span>
  );
}

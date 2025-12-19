import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectSteps, createStep, updateStep, deleteStep, reorderStepsByPhase } from "@/apis/step";
import { createStepRequest, getProjectStepRequests } from "@/apis/stepRequest";
import { AttachmentInput, type UploadedAttachment } from "@/components/attachments/AttachmentInput";
import { StepResponse, StepRequestSummaryResponse, StepPhase } from "@/lib/stepTypes";
import { useToast } from "@/hooks/use-toast";
import { boardStatusLabels, boardStatusStyles } from "@/constants/boardStatus";
import { stepRequestStatusMap } from "@/constants/stepRequestStatus";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useUserStore } from "@/stores/user";
import { Plus, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Skeleton } from "@/components/ui/skeleton";

const getDefaultPhaseByTab = (tab: string): StepPhase => {
  if (tab === "IN_PROGRESS") return "IN_PROGRESS";
  if (tab === "DELIVERY") return "DELIVERY";
  if (tab === "MAINTENANCE") return "MAINTENANCE";
  return "CONTRACT";
};

const PHASE_LABEL_MAP: Record<StepPhase, string> = {
  CONTRACT: "계약",
  IN_PROGRESS: "진행",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
};

const DraggableStepCard = ({
  step,
  children,
  isCrossPhaseBlocked,
  isDragging,
  disabled,
}: {
  step: StepResponse;
  children: ReactNode;
  isCrossPhaseBlocked: boolean;
  isDragging: boolean;
  disabled: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isSorting } = useSortable({
    id: step.id,
    disabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex flex-col",
        step.status === "APPROVED" && "bg-muted",
        (isCrossPhaseBlocked || disabled) && "cursor-not-allowed",
        isSorting && "shadow-lg",
        isDragging && "ring-2 ring-primary/40"
      )}
    >
      {children}
    </Card>
  );
};

const StepSkeletonCard = () => (
  <Card className="flex flex-col">
    <CardHeader className="border-b space-y-3 py-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-2/3" />
    </CardHeader>
    <CardContent className="flex-1 pt-4 space-y-4">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </CardContent>
  </Card>
);

export default function Approvals() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectId = Number(id);
  const currentPhase = searchParams.get("tab") ?? "ALL";

  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ["project-steps", projectId],
    queryFn: () => getProjectSteps(projectId),
    enabled: !!projectId,
  });

  const { data: requestData, isLoading: requestsLoading } = useQuery({
    queryKey: ["project-step-requests", projectId, page],
    queryFn: () => getProjectStepRequests(projectId, page, pageSize),
    enabled: !!projectId,
  });

  const orderedSteps = stepsData?.data.steps ?? [];
  const stepRequestSummaries = requestData?.stepRequestSummaryResponses ?? [];

  const filteredSteps = useMemo(() => {
    if (currentPhase === "ALL") return orderedSteps;
    return orderedSteps.filter((s) => s.phase === currentPhase);
  }, [orderedSteps, currentPhase]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">단계별 승인 요청</h1>
            <p className="text-sm text-muted-foreground mt-1">
              프로젝트 단계별 승인 상태를 확인하세요
            </p>
          </div>
        </div>

        <DndContext sensors={sensors}>
          <SortableContext
            items={filteredSteps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(stepsLoading || requestsLoading) &&
                Array.from({ length: 6 }).map((_, i) => (
                  <StepSkeletonCard key={i} />
                ))}

              {!stepsLoading &&
                !requestsLoading &&
                filteredSteps.map((step) => {
                  const requests = stepRequestSummaries.filter((r) => r.stepId === step.id);
                  const isApproved = step.status === "APPROVED";
                  const statusKey = isApproved ? "complete" : "progress";
                  const status = boardStatusLabels[statusKey];
                  const statusClass = boardStatusStyles[statusKey];

                  return (
                    <DraggableStepCard
                      key={step.id}
                      step={step}
                      isCrossPhaseBlocked={false}
                      isDragging={false}
                      disabled={step.status !== "PENDING"}
                    >
                      <CardHeader className="border-b space-y-2 py-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{step.title}</CardTitle>
                          <Badge className={cn(statusClass)}>{status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 pt-4 space-y-4">
                        {requests.length === 0 && (
                          <div className="border border-dashed rounded-lg p-6 text-sm text-muted-foreground text-center">
                            승인 요청이 없습니다.
                          </div>
                        )}
                        {requests.map((r) => {
                          const badge = stepRequestStatusMap[r.status];
                          return (
                            <button
                              key={r.id}
                              onClick={() =>
                                navigate(`/project/${projectId}/approvals/${r.id}?tab=${currentPhase}`)
                              }
                              className="w-full rounded-lg border p-3 text-left hover:shadow-md"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="text-sm font-medium line-clamp-2">
                                  {r.title}
                                </div>
                                <Badge className={badge.className}>{badge.label}</Badge>
                              </div>
                            </button>
                          );
                        })}
                      </CardContent>
                    </DraggableStepCard>
                  );
                })}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </ProjectLayout>
  );
}

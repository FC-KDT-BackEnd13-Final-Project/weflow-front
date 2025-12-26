import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import api from "@/apis/api";
import { cn } from "@/lib/utils";

type HistoryAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT"
  | "UPLOAD"
  | "DOWNLOAD"
  | "REMOVE"
  | "SUBMIT";

type HistoryTarget =
  | "POST"
  | "POST_ANSWER"
  | "COMMENT"
  | "PROJECT"
  | "PROJECT_MEMBER"
  | "USER"
  | "COMPANY"
  | "CHECKLIST"
  | "CHECKLIST_QUESTION"
  | "CHECKLIST_OPTION"
  | "ATTACHMENT"
  | "STEP"
  | "STEP_REQUEST"
  | "STEP_RESPONSE"
  | "TEMPLATE";

interface ProjectHistoryLog {
  logId: number;
  actionType: HistoryAction;
  targetTable: HistoryTarget;
  targetId: number;
  ipAddress: string;
  createdAt: string;
  userId: number;
  userName: string;
  projectId: number;
  projectName: string;
}

interface ProjectHistoryResponse {
  logs: ProjectHistoryLog[];
  totalCount: number;
}

const actionTypeLabels: Record<HistoryAction, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
  LOGIN: "로그인",
  LOGOUT: "로그아웃",
  APPROVE: "승인",
  REJECT: "반려",
  UPLOAD: "업로드",
  DOWNLOAD: "다운로드",
  REMOVE: "제거",
  SUBMIT: "제출",
};

const targetTableLabels: Record<HistoryTarget, string> = {
  POST: "게시글",
  POST_ANSWER: "게시글 답변",
  COMMENT: "댓글",
  PROJECT: "프로젝트",
  PROJECT_MEMBER: "프로젝트 멤버",
  USER: "회원",
  COMPANY: "회사",
  CHECKLIST: "체크리스트",
  CHECKLIST_QUESTION: "체크리스트 질문",
  CHECKLIST_OPTION: "체크리스트 옵션",
  ATTACHMENT: "첨부파일",
  STEP: "단계",
  STEP_REQUEST: "단계 요청",
  STEP_RESPONSE: "단계 응답",
  TEMPLATE: "템플릿",
};

const actionTypeOptions: HistoryAction[] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "REJECT",
  "UPLOAD",
  "DOWNLOAD",
  "REMOVE",
  "SUBMIT",
];

const targetTableOptions: HistoryTarget[] = [
  "POST",
  "POST_ANSWER",
  "COMMENT",
  "PROJECT",
  "PROJECT_MEMBER",
  "USER",
  "COMPANY",
  "CHECKLIST",
  "CHECKLIST_QUESTION",
  "CHECKLIST_OPTION",
  "ATTACHMENT",
  "STEP",
  "STEP_REQUEST",
  "STEP_RESPONSE",
  "TEMPLATE",
];

const targetBadgeClass = (table: string) => {
  const map: Record<string, string> = {
    POST: "bg-sky-100 text-sky-800",
    POST_ANSWER: "bg-sky-100 text-sky-800",
    COMMENT: "bg-lime-100 text-lime-800",
    PROJECT: "bg-blue-100 text-blue-800",
    PROJECT_MEMBER: "bg-cyan-100 text-cyan-800",
    USER: "bg-purple-100 text-purple-800",
    COMPANY: "bg-orange-100 text-orange-800",
    CHECKLIST: "bg-green-100 text-green-800",
    CHECKLIST_QUESTION: "bg-emerald-100 text-emerald-800",
    CHECKLIST_OPTION: "bg-emerald-100 text-emerald-800",
    ATTACHMENT: "bg-amber-100 text-amber-800",
    STEP: "bg-indigo-100 text-indigo-800",
    STEP_REQUEST: "bg-pink-100 text-pink-800",
    STEP_RESPONSE: "bg-rose-100 text-rose-800",
    TEMPLATE: "bg-teal-100 text-teal-800",
  };
  return map[table] ?? "bg-gray-100 text-gray-700";
};

const actionBadgeClass = (action: string) => {
  const map: Record<string, string> = {
    CREATE: "bg-emerald-100 text-emerald-800",
    UPDATE: "bg-amber-100 text-amber-800",
    DELETE: "bg-rose-100 text-rose-800",
    LOGIN: "bg-blue-100 text-blue-800",
    LOGOUT: "bg-blue-100 text-blue-800",
    APPROVE: "bg-green-100 text-green-800",
    REJECT: "bg-red-100 text-red-800",
    UPLOAD: "bg-indigo-100 text-indigo-800",
    DOWNLOAD: "bg-indigo-100 text-indigo-800",
    REMOVE: "bg-rose-100 text-rose-800",
    SUBMIT: "bg-violet-100 text-violet-800",
  };
  return map[action] ?? "bg-gray-100 text-gray-700";
};

const uniqueValues = (values: Array<string | null>) =>
  Array.from(new Set(values.filter(Boolean) as string[]));

export default function History() {
  const { id } = useParams<{ id: string }>();
  const [projectName, setProjectName] = useState("");
  const [logs, setLogs] = useState<ProjectHistoryLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const params: Record<string, string | number> = { page, size };
        if (actionFilter !== "all") params.actionType = actionFilter;
        if (targetFilter !== "all") params.targetTable = targetFilter;
        if (startDate) params.startDate = `${startDate}T00:00:00`;
        if (endDate) params.endDate = `${endDate}T23:59:59`;
        if (search.trim()) params.keyword = search.trim();
        const response = await api.get(`/api/admin/logs/projects/${id}`, {
          params,
          signal: controller.signal,
        });
        const data: ProjectHistoryResponse = response.data?.data;
        setLogs(data?.logs ?? []);
        setTotalCount(data?.totalCount ?? 0);
        if (!projectName && data?.logs?.length) {
          setProjectName(data.logs[0].projectName);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("히스토리를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchLogs();
    return () => controller.abort();
  }, [id, actionFilter, targetFilter, startDate, endDate, search, page, size, projectName]);

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = logs.filter((log) => {
      const matchesAction = actionFilter === "all" || log.actionType === actionFilter;
      const matchesTarget = targetFilter === "all" || log.targetTable === targetFilter;
      const matchesSearch =
        !keyword ||
        log.projectName.toLowerCase().includes(keyword) ||
        log.userName.toLowerCase().includes(keyword) ||
        targetTableLabels[log.targetTable].toLowerCase().includes(keyword);
      const logDate = new Date(log.createdAt);
      const matchesStart = !startDate || logDate >= new Date(startDate);
      const matchesEnd = !endDate || logDate <= new Date(endDate + "T23:59:59");
      return matchesAction && matchesTarget && matchesSearch && matchesStart && matchesEnd;
    });

    return filtered.sort((a, b) =>
      sortOrder === "desc"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt)
    );
  }, [logs, actionFilter, targetFilter, search, startDate, endDate, sortOrder]);

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setTargetFilter("all");
    setStartDate("");
    setEndDate("");
    setSortOrder("desc");
  };

  const applyRecent24h = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 1);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));

  return (
    <ProjectLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {projectName ? `${projectName}` : `프로젝트 #${id}`}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">히스토리</h1>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              clearFilters();
              setPage(0);
            }}
          >
            <Filter className="h-4 w-4" />
            초기화
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>필터</CardTitle>
            <CardDescription>로그 조회 조건을 설정하세요.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">행동 유형</p>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="행동 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {actionTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {actionTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">대상 테이블</p>
              <Select value={targetFilter} onValueChange={setTargetFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="대상 테이블" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {targetTableOptions.map((table) => (
                    <SelectItem key={table} value={table}>
                      {targetTableLabels[table]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">검색 (프로젝트/사용자)</p>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="프로젝트 혹은 사용자명을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">정렬</p>
              <Select value={sortOrder} onValueChange={(value: "desc" | "asc") => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="정렬 순서" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">최신순</SelectItem>
                  <SelectItem value="asc">오래된순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">시작일</p>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">종료일</p>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={applyRecent24h}>
                최근 24시간
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }}>
                기간 초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>활동 기록</CardTitle>
              <CardDescription>총 {totalCount.toLocaleString()}건의 로그</CardDescription>
            </div>
            {isLoading && <span className="text-xs text-muted-foreground">불러오는 중...</span>}
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <div className="text-sm text-destructive py-6 text-center">{error}</div>
            )}

            {!isLoading && !error && filteredLogs.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                조건에 맞는 히스토리가 없습니다.
              </div>
            )}

            {filteredLogs.map((log) => (
              <div key={log.logId} className="rounded-lg border px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
                <div className="text-muted-foreground">{formatTime(log.createdAt)}</div>
                <Badge className={cn("text-xs", targetBadgeClass(log.targetTable))}>
                  {targetTableLabels[log.targetTable]}
                </Badge>
                <Badge className={cn("text-xs", actionBadgeClass(log.actionType))}>
                  {actionTypeLabels[log.actionType]}
                </Badge>
                <span className="font-medium">{log.userName}님이</span>
                <span className="font-medium">{targetTableLabels[log.targetTable]}을/를</span>
                <span>{actionTypeLabels[log.actionType]}하였습니다.</span>
              </div>
            ))}
          </CardContent>
          <CardContent className="flex items-center justify-between pt-0">
            <div className="text-sm text-muted-foreground">
              총 {totalCount.toLocaleString()}건 · {page + 1} / {Math.max(1, Math.ceil(totalCount / size))} 페이지
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(size)} onValueChange={(value) => { setSize(Number(value)); setPage(0); }}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="페이지 크기" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}개
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 0}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                >
                  ‹
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={(page + 1) * size >= totalCount}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  ›
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProjectLayout>
  );
}

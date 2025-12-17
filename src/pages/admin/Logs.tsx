import { useEffect, useMemo, useState } from "react";
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
import {
  ActionType,
  TargetTable,
  actionTypeLabels,
  targetTableLabels,
} from "@/constants/logs";

interface ActivityLog {
  logId: number;
  actionType: ActionType;
  targetTable: TargetTable;
  targetId: number;
  ipAddress: string;
  createdAt: string;
  userId: number;
  userName: string;
  projectId: number | null;
  projectName: string | null;
}

interface CursorResponse {
  items: ActivityLog[];
  nextCursor: { createdAt: string; id: number } | null;
  hasNext: boolean;
  totalCount: number | null;
}

const actionTypeOptions = Object.keys(actionTypeLabels) as ActionType[];
const targetTableOptions = Object.keys(targetTableLabels) as TargetTable[];

const targetBadgeClass = (table: string) => {
  const map: Record<string, string> = {
    POST: "bg-sky-100 text-sky-800",
    POST_ANSWER: "bg-sky-100 text-sky-800",
    COMMENT: "bg-lime-100 text-lime-800",
    PROJECT: "bg-blue-100 text-blue-800",
    PROJECT_MEMBER: "bg-cyan-100 text-cyan-800",
    USER: "bg-purple-100 text-purple-800",
    COMPANY: "bg-orange-100 text-orange-800",

    CHECKLIST: "bg-teal-100 text-teal-800",
    CHECKLIST_QUESTION: "bg-cyan-100 text-cyan-800",
    CHECKLIST_OPTION: "bg-cyan-100 text-cyan-800",

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

export default function Logs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [nextCursor, setNextCursor] = useState<CursorResponse["nextCursor"]>(null);
  const [hasNext, setHasNext] = useState(false);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchLogs = async () => {
      try {
        setIsFetching(true);
        setError(null);
        const params: Record<string, string | number | boolean> = {
          limit,
          includeTotal: true,
        };
        if (actionFilter !== "all") params.actionType = actionFilter;
        if (targetFilter !== "all") params.targetTable = targetFilter;
        if (userFilter !== "all") params.userId = Number(userFilter);
        if (projectFilter !== "all") params.projectId = Number(projectFilter);
        if (startDate) params.startDate = `${startDate}T00:00:00`;
        if (endDate) params.endDate = `${endDate}T23:59:59`;
        const response = await api.get("/api/admin/logs/cursor", {
          params,
          signal: controller.signal,
        });
        const data: CursorResponse = response.data?.data;
        setLogs(data?.items ?? []);
        setNextCursor(data?.nextCursor ?? null);
        setHasNext(Boolean(data?.hasNext));
        setTotalCount(
          typeof data?.totalCount === "number" ? data.totalCount : null
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("로그를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setIsFetching(false);
      }
    };
    setLogs([]);
    setNextCursor(null);
    setHasNext(false);
    setTotalCount(null);
    fetchLogs();
    return () => controller.abort();
  }, [actionFilter, targetFilter, userFilter, projectFilter, startDate, endDate, limit]);

  const loadMore = async () => {
    if (!hasNext || !nextCursor || isFetching) return;
    const controller = new AbortController();
    try {
      setIsFetching(true);
      setError(null);
      const params: Record<string, string | number> = {
        limit,
        cursorCreatedAt: nextCursor.createdAt,
        cursorId: nextCursor.id,
      };
      if (actionFilter !== "all") params.actionType = actionFilter;
      if (targetFilter !== "all") params.targetTable = targetFilter;
      if (userFilter !== "all") params.userId = Number(userFilter);
      if (projectFilter !== "all") params.projectId = Number(projectFilter);
      if (startDate) params.startDate = `${startDate}T00:00:00`;
      if (endDate) params.endDate = `${endDate}T23:59:59`;
      const response = await api.get("/api/admin/logs/cursor", {
        params,
        signal: controller.signal,
      });
      const data: CursorResponse = response.data?.data;
      setLogs((prev) => {
        const existing = new Set(prev.map((log) => log.logId));
        const nextItems = (data?.items ?? []).filter((log) => !existing.has(log.logId));
        return [...prev, ...nextItems];
      });
      setNextCursor(data?.nextCursor ?? null);
      setHasNext(Boolean(data?.hasNext));
      if (typeof data?.totalCount === "number") {
        setTotalCount(data.totalCount);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError("로그를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      if (!controller.signal.aborted) setIsFetching(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    return logs
      .filter((log) => {
        const matchesAction = actionFilter === "all" || log.actionType === actionFilter;
        const matchesTarget = targetFilter === "all" || log.targetTable === targetFilter;
        const matchesUser = userFilter === "all" || String(log.userId) === userFilter;
        const matchesProject =
          projectFilter === "all" || String(log.projectId) === projectFilter;
        const matchesSearch =
          !lowerSearch ||
          log.userName.toLowerCase().includes(lowerSearch) ||
          (log.projectName ?? "").toLowerCase().includes(lowerSearch);
        const logDate = new Date(log.createdAt);
        const matchesStart = !startDate || logDate >= new Date(startDate);
        const matchesEnd = !endDate || logDate <= new Date(endDate + "T23:59:59");
        return (
          matchesAction &&
          matchesTarget &&
          matchesUser &&
          matchesProject &&
          matchesSearch &&
          matchesStart &&
          matchesEnd
        );
      })
      .sort((a, b) =>
        sortOrder === "desc"
          ? b.createdAt.localeCompare(a.createdAt)
          : a.createdAt.localeCompare(b.createdAt)
      );
  }, [logs, actionFilter, targetFilter, userFilter, projectFilter, search, startDate, endDate, sortOrder]);

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setTargetFilter("all");
    setUserFilter("all");
    setProjectFilter("all");
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

  const userOptions = useMemo(() => {
    const entries = new Map<number, string>();
    logs.forEach((log) => entries.set(log.userId, log.userName));
    return Array.from(entries.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);
  const projectOptions = useMemo(() => {
    const entries = new Map<number, string>();
    logs.forEach((log) => {
      if (log.projectId && log.projectName) entries.set(log.projectId, log.projectName);
    });
    return Array.from(entries.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">로그 / 활동 기록</h1>
          <p className="text-muted-foreground mt-1">시스템의 모든 활동을 추적합니다</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            clearFilters();
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
                    {actionTypeLabels[type] ?? type}
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
                    {targetTableLabels[table] ?? table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">행위자</p>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="행위자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {userOptions.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">프로젝트</p>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="프로젝트 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {projectOptions.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </SelectItem>
                ))}
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
            <p className="text-xs text-muted-foreground">검색 (사용자/프로젝트)</p>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="이름 또는 프로젝트명을 입력하세요"
            />
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={applyRecent24h}>
              최근 24시간
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              기간 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>로그 목록</CardTitle>
            <CardDescription>
              {typeof totalCount === "number"
                ? `총 ${totalCount.toLocaleString()}건의 활동기록`
                : hasNext
                  ? `${logs.length.toLocaleString()}건 로드됨 (더보기 가능)`
                  : `${logs.length.toLocaleString()}건 로드됨`}
            </CardDescription>
          </div>
          {isFetching && <span className="text-xs text-muted-foreground">불러오는 중...</span>}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive py-6 text-center">{error}</div>
          )}

          {!isFetching && !error && filteredLogs.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">
              조건에 맞는 로그가 없습니다.
            </div>
          )}

          {filteredLogs.map((log) => (
            <div key={log.logId} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{formatTime(log.createdAt)}</span>
                <Badge variant="secondary" className="text-xs">
                  {log.ipAddress}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge className={cn("text-xs hover:bg-inherit hover:opacity-100", targetBadgeClass(log.targetTable))}>
                  {targetTableLabels[log.targetTable] ?? log.targetTable}
                </Badge>
                <Badge className={cn("text-xs hover:bg-inherit hover:opacity-100", actionBadgeClass(log.actionType))}>
                  {actionTypeLabels[log.actionType] ?? log.actionType}
                </Badge>
                {log.projectName && (
                  <span className="text-xs text-muted-foreground ">
                    프로젝트 #{log.projectId} · {log.projectName}
                  </span>
                )}
              </div>

              <div className="text-sm">
                <span className="font-semibold">{log.userName}</span>님이{" "}
                <span className="font-semibold">
                  {targetTableLabels[log.targetTable] ?? log.targetTable}
                </span>
                {log.targetId ? ` #${log.targetId}` : ""}에{" "}
                {actionTypeLabels[log.actionType] ?? log.actionType} 작업을 수행했습니다.
              </div>
            </div>
          ))}
        </CardContent>
        <CardContent className="flex items-center justify-between pt-0">
          <div className="flex items-center gap-2">
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                setLimit(Number(value));
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="limit" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}개
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadMore} disabled={!hasNext || isFetching}>
              {hasNext ? "더 불러오기" : "마지막 페이지"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

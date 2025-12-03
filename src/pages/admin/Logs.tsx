import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const Logs = () => {
  const logs = [
    {
      time: "2025-11-20 10:13",
      action: "관리자 홍길동이 회원 '김철수' 생성",
      type: "회원",
      user: "홍길동",
      company: "DevCorp",
      project: "-",
      actionDetail: "생성",
      status: "성공",
    },
    {
      time: "2025-11-20 04:55",
      action: "개발사 4에서 프로젝트 'Landing Page' 생성 요청",
      type: "프로젝트",
      user: "이영희",
      company: "DevCorp",
      project: "Landing Page",
      actionDetail: "생성",
      status: "성공",
    },
    {
      time: "2025-11-20 04:30",
      action: "고객사 B 멤버 3명 CSV 업로드 완료",
      type: "회원",
      user: "김철수",
      company: "ClientB",
      project: "-",
      actionDetail: "생성",
      status: "성공",
    },
    {
      time: "2025-11-19 16:22",
      action: "시스템 관리자 계정 비밀번호 초기화됨",
      type: "시스템",
      user: "시스템",
      company: "weflow",
      project: "-",
      actionDetail: "수정",
      status: "성공",
    },
    {
      time: "2025-11-19 14:05",
      action: "프로젝트 'Web Renewal' 진행률 42% 업데이트",
      type: "프로젝트",
      user: "박민수",
      company: "DevCorp",
      project: "Web Renewal",
      actionDetail: "수정",
      status: "성공",
    },
    {
      time: "2025-11-19 11:30",
      action: "회사 'ClientA Corporation' 정보 수정",
      type: "회사",
      user: "홍길동",
      company: "ClientA",
      project: "-",
      actionDetail: "수정",
      status: "실패",
    },
  ];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [actionDetailFilter, setActionDetailFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const parseDateTime = (t: string) => new Date(t.replace(" ", "T"));
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  const uniqueValues = <T extends string>(arr: string[]) =>
    Array.from(new Set(arr)).filter(Boolean) as T[];
  const users = uniqueValues(logs.map((l) => l.user));
  const companies = uniqueValues(logs.map((l) => l.company));
  const projects = uniqueValues(logs.map((l) => l.project).filter((p) => p !== "-"));
  const actionDetails = uniqueValues(logs.map((l) => l.actionDetail));
  const statuses = uniqueValues(logs.map((l) => l.status));

  const filteredLogs = useMemo(() => {
    const filtered = logs.filter((log) => {
      const matchType = typeFilter === "all" || log.type === typeFilter;
      const matchSearch =
        search.trim() === "" ||
        log.action.toLowerCase().includes(search.toLowerCase());
      const logDate = parseDateTime(log.time);
      const matchStart = !startDate || logDate >= new Date(startDate);
      const matchEnd = !endDate || logDate <= new Date(endDate + "T23:59:59");
      const matchUser = userFilter === "all" || log.user === userFilter;
      const matchCompany = companyFilter === "all" || log.company === companyFilter;
      const matchProject = projectFilter === "all" || log.project === projectFilter;
      const matchActionDetail =
        actionDetailFilter === "all" || log.actionDetail === actionDetailFilter;
      return (
        matchType &&
        matchSearch &&
        matchStart &&
        matchEnd &&
        matchUser &&
        matchCompany &&
        matchProject &&
        matchActionDetail
      );
    });

    return filtered.sort((a, b) => {
      if (sortOrder === "desc") return b.time.localeCompare(a.time);
      return a.time.localeCompare(b.time);
    });
  }, [
    logs,
    search,
    typeFilter,
    startDate,
    endDate,
    userFilter,
    companyFilter,
    projectFilter,
    actionDetailFilter,
    sortOrder,
  ]);

  const applyRecent24h = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 1);
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const applySystem = () => {
    setTypeFilter("시스템");
  };

  const activeFilters = [
    typeFilter !== "all" && { label: "유형", value: typeFilter, clear: () => setTypeFilter("all") },
    userFilter !== "all" && { label: "행위자", value: userFilter, clear: () => setUserFilter("all") },
    companyFilter !== "all" && { label: "회사", value: companyFilter, clear: () => setCompanyFilter("all") },
    projectFilter !== "all" && { label: "프로젝트", value: projectFilter, clear: () => setProjectFilter("all") },
    actionDetailFilter !== "all" && { label: "행동", value: actionDetailFilter, clear: () => setActionDetailFilter("all") },
    startDate && { label: "시작", value: startDate, clear: () => setStartDate("") },
    endDate && { label: "종료", value: endDate, clear: () => setEndDate("") },
    search && { label: "검색", value: search, clear: () => setSearch("") },
  ].filter(Boolean) as { label: string; value: string; clear: () => void }[];

  const resetAll = () => {
    setSearch("");
    setTypeFilter("all");
    setUserFilter("all");
    setCompanyFilter("all");
    setProjectFilter("all");
    setActionDetailFilter("all");
    setStartDate("");
    setEndDate("");
    setSortOrder("desc");
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      회원: "bg-blue-100 text-blue-700",
      프로젝트: "bg-green-100 text-green-700",
      회사: "bg-purple-100 text-purple-700",
      시스템: "bg-orange-100 text-orange-700",
    };
    return (
      <Badge className={`${colors[type]} hover:${colors[type]}`}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">로그 / 활동 기록</h1>
          <p className="text-muted-foreground mt-1">
            시스템의 모든 활동을 추적합니다
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 pb-2">
            <Activity className="h-5 w-5" />
            전체 활동 로그
          </CardTitle>

          <CardDescription className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Filter className="h-3 w-3" />
            원하는 조건으로 바로 필터링할 수 있습니다.
          </CardDescription>

          <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
            {/* 빠른 필터 */}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={applyRecent24h}>
                최근 24시간
              </Button>
              <Button size="sm" variant="outline" onClick={applySystem}>
                시스템 로그
              </Button>
            </div>

            {/* 검색 */}
              <Input
                placeholder="키워드 검색 (액션 내용)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10"
              />

            {/* 주요 필터 */}
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">유형</div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10">
                    <SelectValue placeholder="유형 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="회원">회원</SelectItem>
                  <SelectItem value="프로젝트">프로젝트</SelectItem>
                  <SelectItem value="회사">회사</SelectItem>
                  <SelectItem value="시스템">시스템</SelectItem>
                </SelectContent>
              </Select>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">행위자</div>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="h-10">
                    <SelectValue placeholder="행위자 전체" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">회사</div>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="h-10">
                    <SelectValue placeholder="회사 전체" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">프로젝트</div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-10">
                    <SelectValue placeholder="프로젝트 전체" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">행동</div>
              <Select value={actionDetailFilter} onValueChange={setActionDetailFilter}>
                <SelectTrigger className="h-10">
                    <SelectValue placeholder="행동 전체" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                  {actionDetails.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>

            {/* 날짜 + 정렬 */}
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10"
              />
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">최신순</SelectItem>
                  <SelectItem value="asc">오래된순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 활성 필터 칩 */}
            {(activeFilters.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((f) => (
                  <Badge
                    key={`${f.label}-${f.value}`}
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={f.clear}
                  >
                    {f.label}: {f.value} ✕
                  </Badge>
                ))}
                <Button size="sm" variant="ghost" className="h-7" onClick={resetAll}>
                  필터 초기화
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant="outline" className="text-xs shrink-0 font-mono">
                    {log.time}
                  </Badge>
                  {getTypeBadge(log.type)}
                  <p className="text-sm flex-1">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;

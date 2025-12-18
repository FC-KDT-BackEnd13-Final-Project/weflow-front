import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AdminProjectDetailResponse,
  AdminProjectMemberListItem,
  ProjectPhase,
  ProjectStatus,
  deleteAdminProject,
  fetchAdminProjectDetail,
  fetchAdminProjectMembers,
} from "@/apis/adminProjects";
import { adminApi } from "@/apis/admin";

const statusLabels: Record<ProjectStatus, string> = {
  OPEN: "진행",
  CLOSED: "종료",
};

const phaseLabels: Record<ProjectPhase, string> = {
  CONTRACT: "계약",
  IN_PROGRESS: "진행",
  DELIVERY: "납품",
  MAINTENANCE: "유지보수",
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const ProjectDetail = () => {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<AdminProjectDetailResponse | null>(null);
  const [members, setMembers] = useState<AdminProjectMemberListItem[]>([]);
  const [customerCompanyName, setCustomerCompanyName] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const id = idParam ? Number(idParam) : null;

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [detailRes, memberRes] = await Promise.all([
        fetchAdminProjectDetail(id),
        fetchAdminProjectMembers(id),
      ]);
      setDetail(detailRes);
      setMembers(memberRes.members ?? []);
      setCustomerCompanyName(detailRes.customerCompanyName ?? null);
    } catch (err) {
      setError("프로젝트 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const customerCompanyId = detail?.customerCompanyId;

  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!customerCompanyId) return;
      try {
        const res = await adminApi.getCompanyById(customerCompanyId);
        setCustomerCompanyName(res.data.name);
      } catch {
        // ignore, fallback to ID
      }
    };
    if (!customerCompanyName && customerCompanyId) {
      fetchCompanyName();
    }
  }, [customerCompanyId, customerCompanyName]);

  const statusText = useMemo(() => {
    if (!detail) return "-";
    if (detail.deletedAt) return statusLabels.CLOSED;
    const status = detail.status as ProjectStatus;
    return statusLabels[status] ?? detail.status;
  }, [detail]);

  const phaseText = useMemo(() => {
    if (!detail || !detail.phase) return "-";
    const phase = detail.phase as ProjectPhase;
    return phaseLabels[phase] ?? detail.phase;
  }, [detail]);
  const agencyMembers = useMemo(
    () => members.filter((m) => m.userRole === "AGENCY"),
    [members]
  );
  const clientMembers = useMemo(
    () => members.filter((m) => m.userRole === "CLIENT"),
    [members]
  );

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      await deleteAdminProject(id);
      navigate("/admin/projects");
    } catch (err) {
      setError("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">프로젝트 관리</h1>
          <p className="text-muted-foreground mt-1">
            프로젝트 관리 {">"} 프로젝트 목록 {">"} 프로젝트 상세
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>프로젝트 정보</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/admin/projects")}
            >
              목록
            </Button>
            {id && !detail?.deletedAt && (
              <Button
                className="gap-2"
                onClick={() => navigate(`/admin/projects/${id}/edit`)}
              >
                수정
              </Button>
            )}
            {!detail?.deletedAt && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleDelete}
              >
                삭제
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && (
            <div className="text-muted-foreground">불러오는 중...</div>
          )}
          {error && !loading && <div className="text-destructive">{error}</div>}

          {!loading && !error && detail && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm font-medium">
                      프로젝트명
                    </Badge>
                    <span className="font-medium">{detail.name}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="text-sm font-medium">
                      설명
                    </Badge>
                    <span>
                      {detail.description || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm font-medium">
                      상태
                    </Badge>
                    <span className="font-medium">{statusText}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm font-medium">
                      단계
                    </Badge>
                    <span className="font-medium">{phaseText}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm font-medium">
                      회사
                    </Badge>
                    <span>
                      {customerCompanyName ??
                        detail.customerCompanyName ??
                        detail.customerCompanyId ??
                        "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm font-medium">
                        시작일
                      </Badge>
                      <span className="font-mono">
                        {formatDateTime(detail.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm font-medium">
                        종료예정
                      </Badge>
                      <span className="font-mono">
                        {formatDateTime(detail.endDateExpected)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm font-medium">
                        종료일
                      </Badge>
                      <span className="font-mono">
                        {formatDateTime(detail.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm font-medium">
                        계약 금액
                      </Badge>
                      <span className="font-mono">
                        {detail.contractAmount
                          ? `${detail.contractAmount.toLocaleString()}원`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="text-sm font-medium">
                      계약서
                    </Badge>
                    {detail.contractFileUrl ? (
                      <a
                        href={detail.contractFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                        {detail.contractFileUrl}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">멤버</h3>
                  <span className="text-sm text-muted-foreground">
                    총 {members.length}명
                  </span>
                </div>

                <MemberTable title="개발사" items={agencyMembers} />
                <MemberTable title="고객사" items={clientMembers} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const MemberTable = ({
  title,
  items,
}: {
  title: string;
  items: AdminProjectMemberListItem[];
}) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <span className="text-xs text-muted-foreground">{items.length}명</span>
      </div>
      <div className="grid grid-cols-6 gap-4 bg-muted p-3 text-sm font-medium">
        <div>이름</div>
        <div>이메일</div>
        <div>연락처</div>
        <div>회사</div>
        <div>역할</div>
        <div>삭제 여부</div>
      </div>
      <div className="divide-y">
        {items.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            등록된 멤버가 없습니다.
          </div>
        )}
        {items.map((member) => (
          <div
            key={member.projectMemberId}
            className="grid grid-cols-6 gap-4 p-3 text-sm"
          >
            <div>{member.username}</div>
            <div className="text-muted-foreground">{member.email}</div>
            <div className="text-muted-foreground">{member.phone ?? "-"}</div>
            <div className="text-muted-foreground">{member.companyName}</div>
            <div className="font-medium">{member.projectRole}</div>
            <div className="text-muted-foreground">
              {member.removedAt
                ? `삭제됨: ${formatDateTime(member.removedAt)}`
                : "활성"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDetail;

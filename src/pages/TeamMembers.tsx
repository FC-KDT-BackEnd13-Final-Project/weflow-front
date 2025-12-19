import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RefreshCcw, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  ProjectMember,
  fetchProjectMembers,
  removeProjectMember,
  updateProjectMemberRole,
} from "@/apis/projectMembers";
import { useUserStore } from "@/stores/user";
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton UI 임포트 추가

const roleLabels: Record<
  ProjectMember["projectRole"],
  { label: string; badgeVariant: BadgeProps["variant"] }
> = {
  ADMIN: { label: "관리자", badgeVariant: "default" },
  MEMBER: { label: "멤버", badgeVariant: "secondary" },
};

// 멤버 카드 스켈레톤 컴포넌트 정의
const MemberCardSkeleton = () => (
  <Card className="p-4">
    <CardContent className="flex flex-col items-center text-center space-y-3 p-4">
      {/* 프로필 아바타 스켈레톤 */}
      <Skeleton className="h-16 w-16 rounded-full" />

      {/* 이름 및 회사 스켈레톤 */}
      <div className="space-y-1">
        <Skeleton className="h-5 w-24" /> {/* 이름 */}
        <Skeleton className="h-4 w-20" /> {/* 회사명 */}
      </div>

      {/* 역할 뱃지 스켈레톤 */}
      <Skeleton className="h-5 w-16 rounded-full" />
    </CardContent>
  </Card>
);

export default function TeamMembers() {
  const { user } = useUserStore();
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(
    null
  );
  const [roleSelection, setRoleSelection] = useState<"ADMIN" | "MEMBER">(
    "MEMBER"
  );
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const projectId = useMemo(() => (id ? Number(id) : null), [id]);

  const extractErrorMessage = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      const resp = err.response?.data as { message?: string } | undefined;
      if (resp?.message) return resp.message;
    }
    return fallback;
  };

  /** 멤버 목록 로드 */
  const loadMembers = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjectMembers(projectId);
      const activeMembers = (data ?? []).filter((m) => !m.removedAt);
      setMembers(activeMembers);
    } catch (err) {
      setError(extractErrorMessage(err, "멤버 정보를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const myProjectRole = useMemo(() => {
    if (!user) return null;
    const me = members.find((m) => m.userId === user.id);
    return me?.projectRole ?? null;
  }, [members, user]);

  // AGENCY + ADMIN 만 권한 변경 가능
  const canManageMembers = user?.role === "AGENCY" && myProjectRole === "ADMIN";

  /** 모달 오픈 */
  const openRoleDialog = (member: ProjectMember) => {
    if (!canManageMembers) return; // 고객사는 클릭해도 모달 안 열림

    setSelectedMember(member);
    setRoleSelection(member.projectRole);
  };

  const closeRoleDialog = () => setSelectedMember(null);

  /** 권한 선택 */
  const handleRoleChange = (value: "ADMIN" | "MEMBER") => {
    if (!canManageMembers) return; // 읽기 전용
    setRoleSelection(value);
  };

  /** 권한 저장 */
  const handleSaveRole = async () => {
    if (!selectedMember || !projectId || !canManageMembers) return;

    try {
      setSaving(true);

      await updateProjectMemberRole(projectId, selectedMember.projectMemberId, {
        projectRole: roleSelection,
      });

      // 상태 업데이트
      setMembers((prev) =>
        prev.map((m) =>
          m.projectMemberId === selectedMember.projectMemberId
            ? { ...m, projectRole: roleSelection }
            : m
        )
      );

      toast({ title: "권한이 변경되었습니다." });
      closeRoleDialog();
    } catch (err) {
      toast({
        title: "권한 변경 실패",
        description: extractErrorMessage(err, "변경 권한이 없습니다."),
      });
    } finally {
      setSaving(false);
    }
  };

  /** 멤버 삭제 */
  const handleRemoveMember = async () => {
    if (!selectedMember || !projectId || !canManageMembers) return;

    const confirmed = window.confirm("해당 멤버를 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      setRemoving(true);

      await removeProjectMember(projectId, selectedMember.projectMemberId);

      setMembers((prev) =>
        prev.filter((m) => m.projectMemberId !== selectedMember.projectMemberId)
      );

      toast({ title: "멤버가 제거되었습니다." });
      closeRoleDialog();
    } catch (err) {
      toast({
        title: "삭제 실패",
        description: extractErrorMessage(err, "삭제 권한이 없습니다."),
      });
    } finally {
      setRemoving(false);
    }
  };

  /** 저장 버튼 disable 조건 */
  const disableSave =
    !selectedMember ||
    roleSelection === selectedMember?.projectRole ||
    saving ||
    !canManageMembers;

  // 로딩 플레이스홀더 배열
  const loadingPlaceholders = Array.from({ length: 6 });

  return (
    <ProjectLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold">멤버 관리</h1>
            <p className="text-muted-foreground">프로젝트 멤버 목록입니다.</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadMembers}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingPlaceholders.map((_, index) => (
              <MemberCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* 에러 상태 */}
        {!loading && error && (
          <div className="text-center py-12 border rounded-lg bg-destructive/10 text-destructive">
            <p>{error}</p>
            <Button
              variant="link"
              onClick={loadMembers}
              className="mt-2 text-destructive"
            >
              다시 시도
            </Button>
          </div>
        )}

        {/* 멤버 리스트 */}
        {!loading && !error && members.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <Card
                key={member.projectMemberId}
                className={`${canManageMembers
                  ? "cursor-pointer hover:shadow-lg"
                  : "cursor-default"
                  } 
                            transition-all p-4`}
                onClick={() => canManageMembers && openRoleDialog(member)}
              >
                <CardContent className="flex flex-col items-center text-center space-y-3 p-4">
                  {/* 프로필 */}
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl">
                      {(member.name || member.email || "M")[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* 이름 */}
                  <div>
                    <p className="font-semibold text-lg">
                      {member.name || "이름 없음"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {member.companyName}
                    </p>
                  </div>

                  {/* 역할 뱃지 */}
                  <Badge variant={roleLabels[member.projectRole].badgeVariant}>
                    {roleLabels[member.projectRole].label}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 멤버 없음 상태 */}
        {!loading && !error && members.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-secondary/5 text-muted-foreground">
            <p>현재 프로젝트에 참여하는 멤버가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 권한 변경 모달 */}
      <Dialog
        open={Boolean(selectedMember)}
        onOpenChange={(o) => !o && closeRoleDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>권한 변경</DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedMember.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMember.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label>권한</Label>
                <RadioGroup
                  value={roleSelection}
                  onValueChange={handleRoleChange}
                  disabled={!canManageMembers}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="ADMIN"
                      id="admin"
                      disabled={!canManageMembers}
                    />
                    <Label htmlFor="admin">관리자</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="MEMBER"
                      id="member"
                      disabled={!canManageMembers}
                    />
                    <Label htmlFor="member">멤버</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex w-full justify-between items-center">
              {/* 삭제 버튼 */}
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={handleRemoveMember}
                disabled={!canManageMembers || removing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                멤버 삭제
              </Button>

              {/* 저장/취소 */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeRoleDialog}>
                  취소
                </Button>
                <Button onClick={handleSaveRole} disabled={disableSave}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectLayout>
  );
}
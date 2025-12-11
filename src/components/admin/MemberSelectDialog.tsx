import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// -------- 타입 정의 --------
export interface MemberData {
  id: string;
  name: string;
  company: string;
  companyType: "agency" | "client";
  position: string;
  companyId?: number;
}

export interface SelectedMember {
  id: string;
  name: string;
  company: string;
  companyType: "agency" | "client";
  role: string;
  canDelete: boolean;
}

interface MemberSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (members: SelectedMember[]) => void;

  existingMemberIds: string[];
  existingAdminId?: string | null;

  selectedClientCompany: string | null;
  setSelectedClientCompany: (v: string | null) => void;

  users?: MemberData[]; // 서버에서 내려오는 실제 사용자 목록
}

// --------------------------------------------------------------

const MemberSelectDialog = ({
  open,
  onOpenChange,
  onConfirm,
  existingMemberIds,
  existingAdminId,
  selectedClientCompany,
  setSelectedClientCompany,
  users,
}: MemberSelectDialogProps) => {
  // users undefined 방지
  const safeUsers = users ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"agency" | "client">("agency");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adminMemberId, setAdminMemberId] = useState<string | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);
  const [localClientCompany, setLocalClientCompany] = useState<string | null>(
    selectedClientCompany
  );

  // id → member 매핑
  const memberById = useMemo(() => {
    const map = new Map<string, MemberData>();
    safeUsers.forEach((m) => map.set(m.id, m));
    return map;
  }, [safeUsers]);

  const companiesFromIds = (ids: string[]) =>
    ids
      .map((id) => memberById.get(id)?.company)
      .filter((c): c is string => Boolean(c));

  // ------------------------------------------
  // 모달 열릴 때 기존 선택 목록 복원
  // ------------------------------------------
  useEffect(() => {
    if (open) {
      setSelectedIds(existingMemberIds);
      setAdminMemberId(existingAdminId ?? null);

      const companies = companiesFromIds(existingMemberIds);

      // 개발사 기본 열림 + 기존 선택된 회사 열림
      const defaultExpanded = new Set(["DevCorp", ...companies]);
      setExpandedCompanies(Array.from(defaultExpanded));
    }
  }, [open, existingMemberIds, existingAdminId, safeUsers]);

  // 고객사는 **1개 회사만 선택 가능**
  useEffect(() => {
    const client = selectedIds
      .map((id) => memberById.get(id))
      .find((m) => m?.companyType === "client");

    setLocalClientCompany(client?.company ?? null);
  }, [selectedIds, memberById]);

  // ------------------------------------------
  // 필터링
  // ------------------------------------------
  const filteredMembers = useMemo(() => {
    return safeUsers.filter((m) => {
      const matchTab = m.companyType === activeTab;
      const matchSearch =
        searchQuery === "" ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.company.toLowerCase().includes(searchQuery.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [safeUsers, activeTab, searchQuery]);

  const groupedByCompany = useMemo(() => {
    const groups: Record<string, MemberData[]> = {};
    filteredMembers.forEach((m) => {
      if (!groups[m.company]) groups[m.company] = [];
      groups[m.company].push(m);
    });
    return groups;
  }, [filteredMembers]);

  // ---------------------------
  // 고객사 단일 선택 로직
  // ---------------------------
  const isCompanySelectable = (company: string, type: "agency" | "client") => {
    if (type === "agency") return true;
    if (!localClientCompany) return true;
    return localClientCompany === company;
  };

  const isAllCompanySelected = (members: MemberData[]) =>
    members.every((m) => selectedIds.includes(m.id));

  const isCompanyPartiallySelected = (members: MemberData[]) =>
    members.some((m) => selectedIds.includes(m.id)) &&
    !isAllCompanySelected(members);

  // ---------------------------
  // 회사 전체 선택
  // ---------------------------
  const handleToggleCompanyAll = (company: string, members: MemberData[]) => {
    const ids = members.map((m) => m.id);
    const companyType = members[0].companyType;

    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));

      if (!allSelected) {
        // 체크 활성화
        if (companyType === "client") {
          setLocalClientCompany(company);
        }
        return Array.from(new Set([...prev, ...ids]));
      }

      // 체크 해제
      const updated = prev.filter((id) => !ids.includes(id));

      if (companyType === "client") {
        const stillSelected = updated.some(
          (id) => memberById.get(id)?.company === company
        );
        if (!stillSelected) setLocalClientCompany(null);
      }

      return updated;
    });
  };

  // ---------------------------
  // 개별 멤버 선택
  // ---------------------------
  const handleToggleMember = (member: MemberData, checked: boolean) => {
    setSelectedIds((prev) => {
      const already = prev.includes(member.id);

      // 체크
      if (checked && !already) {
        if (member.companyType === "client") {
          setLocalClientCompany(member.company);
        }
        return [...prev, member.id];
      }

      // 체크 해제
      const updated = prev.filter((id) => id !== member.id);

      if (member.companyType === "client") {
        const stillExist = updated.some(
          (id) => memberById.get(id)?.company === member.company
        );
        if (!stillExist) setLocalClientCompany(null);
      }

      if (adminMemberId === member.id) {
        setAdminMemberId(null);
      }

      return updated;
    });
  };

  // 최고권한 선택
  const handleSelectAdmin = (id: string) => {
    setAdminMemberId(id);

    // 최고권한자는 반드시 selectedIds에 포함
    if (!selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  // ------------------------------------------
  // 회사 그룹 렌더링
  // ------------------------------------------
  const renderCompanyGroup = (
    company: string,
    members: MemberData[],
    showAdminOption: boolean
  ) => {
    if (!members || members.length === 0) return null;

    const type = members[0].companyType;
    const selectable = isCompanySelectable(company, type);

    const allSelected = isAllCompanySelected(members);
    const partial = isCompanyPartiallySelected(members);

    const checkboxState = allSelected ? true : partial ? "indeterminate" : false;
    const isExpanded = expandedCompanies.includes(company);

    return (
      <div key={company} className="border-b last:border-b-0">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            className="flex items-center gap-2"
            onClick={() =>
              setExpandedCompanies((prev) =>
                prev.includes(company)
                  ? prev.filter((c) => c !== company)
                  : [...prev, company]
              )
            }
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>{company}</span>
          </button>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{members.length}명</Badge>

            <Checkbox
              checked={checkboxState}
              disabled={!selectable}
              onCheckedChange={() => handleToggleCompanyAll(company, members)}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-3 space-y-2">
            {members.map((m) => {
              const isChecked = selectedIds.includes(m.id);

              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between py-2 px-3 rounded ${
                    selectable ? "hover:bg-muted/40" : "opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      disabled={!selectable}
                      onCheckedChange={(v) =>
                        handleToggleMember(m, v === true)
                      }
                    />

                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {m.position}
                      </div>
                    </div>
                  </div>

                  {showAdminOption && (
                    <RadioGroup
                      value={adminMemberId || ""}
                      onValueChange={handleSelectAdmin}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value={m.id}
                          disabled={!isChecked}
                        />
                        <Label>최고권한</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ------------------------------------------
  // 최종 완료
  // ------------------------------------------
  const handleConfirm = () => {
    const uniqueIds = Array.from(new Set(selectedIds));

    const result: SelectedMember[] = uniqueIds.map((id) => {
      const m = memberById.get(id)!;
      return {
        id: m.id,
        name: m.name,
        company: m.company,
        companyType: m.companyType,
        role: id === adminMemberId ? "최고권한" : "일반권한",
        canDelete: id !== adminMemberId,
      };
    });

    setSelectedClientCompany(localClientCompany ?? null);
    onConfirm(result);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>멤버 추가</DialogTitle>
        </DialogHeader>

        {/* 검색창 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 회사명으로 검색..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "agency" | "client")}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="agency">개발사</TabsTrigger>
            <TabsTrigger value="client">고객사</TabsTrigger>
          </TabsList>

          {/* 개발사 */}
          <TabsContent
            value="agency"
            className="flex-1 overflow-y-auto border rounded-md mt-2"
          >
            {Object.entries(groupedByCompany)
              .filter(([_, mem]) => mem[0].companyType === "agency")
              .map(([company, members]) =>
                renderCompanyGroup(company, members, true)
              )}
          </TabsContent>

          {/* 고객사 */}
          <TabsContent
            value="client"
            className="flex-1 overflow-y-auto border rounded-md mt-2"
          >
            {Object.entries(groupedByCompany)
              .filter(([_, mem]) => mem[0].companyType === "client")
              .map(([company, members]) =>
                renderCompanyGroup(company, members, false)
              )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button disabled={selectedIds.length === 0} onClick={handleConfirm}>
            추가하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberSelectDialog;

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

// 타입 정의
export interface MemberData {
  id: string;
  name: string;
  company: string;
  companyType: "agency" | "client";
  position: string;
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
}

// 더미 데이터
const allMembers: MemberData[] = [
  { id: "1", name: "홍길동", company: "DevCorp", companyType: "agency", position: "팀장" },
  { id: "2", name: "김영수", company: "DevCorp", companyType: "agency", position: "시니어" },
  { id: "3", name: "이민호", company: "DevCorp", companyType: "agency", position: "주니어" },
  { id: "6", name: "김철수", company: "ClientA", companyType: "client", position: "담당자" },
  { id: "7", name: "이영희", company: "ClientA", companyType: "client", position: "팀장" },
  { id: "8", name: "박민수", company: "ClientA", companyType: "client", position: "대리" },
  { id: "9", name: "최준호", company: "ClientB", companyType: "client", position: "부장" },
  { id: "10", name: "강민정", company: "ClientB", companyType: "client", position: "과장" },
];

const MemberSelectDialog = ({
  open,
  onOpenChange,
  onConfirm,
  existingMemberIds,
  existingAdminId,
  selectedClientCompany,
  setSelectedClientCompany,
}: MemberSelectDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"agency" | "client">("agency");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adminMemberId, setAdminMemberId] = useState<string | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);
  const [localClientCompany, setLocalClientCompany] = useState<string | null>(selectedClientCompany);

  const memberById = useMemo(() => {
    const map = new Map<string, MemberData>();
    allMembers.forEach((m) => map.set(m.id, m));
    return map;
  }, []);

  const getCompaniesFromIds = (ids: string[]) =>
    ids
      .map((id) => memberById.get(id)?.company)
      .filter((c): c is string => Boolean(c));

  // 모달 열릴 때 기존 멤버 반영 + 확장 유지 + 개발사 최고권한 복원
  useEffect(() => {
    if (open) {
      // 최신 existingMemberIds로 선택 상태 동기화
      setSelectedIds(existingMemberIds);
      setAdminMemberId(existingAdminId ?? null);
      setExpandedCompanies((prev) => {
        const companies = getCompaniesFromIds(existingMemberIds);
        const merged = new Set([...prev, "DevCorp", ...companies]);
        return Array.from(merged);
      });
    }
    // 모달 닫힐 때 상태 초기화 방지: onOpenChange(false)에서는 그대로 둔다
    // (필요 시 닫을 때 초기화 로직을 추가할 수 있으나, 선택이 사라지는 것을 방지)
  }, [open, existingMemberIds, existingAdminId, memberById]);

  // 선택된 멤버 중 첫 고객사로 localClientCompany 동기화
  useEffect(() => {
    const client = selectedIds
      .map((id) => memberById.get(id))
      .find((m) => m?.companyType === "client");
    setLocalClientCompany(client?.company ?? selectedClientCompany ?? null);
  }, [selectedIds, selectedClientCompany, memberById]);

  // 선택된 멤버가 있는 회사는 항상 펼침
  useEffect(() => {
    setExpandedCompanies((prev) => {
      const companies = getCompaniesFromIds(selectedIds);
      const merged = new Set([...prev, ...companies]);
      return Array.from(merged);
    });
  }, [selectedIds, memberById]);

  // 필터링
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      const matchTab = m.companyType === activeTab;
      const matchSearch =
        searchQuery === "" ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.company.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [activeTab, searchQuery]);

  const agencyMembers = filteredMembers.filter((m) => m.companyType === "agency");

  const groupedByCompany = useMemo(() => {
    const groups: Record<string, MemberData[]> = {};
    filteredMembers.forEach((m) => {
      if (!groups[m.company]) groups[m.company] = [];
      groups[m.company].push(m);
    });
    return groups;
  }, [filteredMembers]);

  // 한 고객사만 선택 가능
  const isCompanySelectable = (company: string, type: "agency" | "client") => {
    if (type === "agency") return true;
    if (!localClientCompany) return true;
    return localClientCompany === company;
  };

  // 전체 선택 여부
  const isCompanyAllSelected = (members: MemberData[]) =>
    members.every((m) => selectedIds.includes(m.id));

  // 부분 선택 여부
  const isCompanyPartiallySelected = (members: MemberData[]) =>
    members.some((m) => selectedIds.includes(m.id)) &&
    !isCompanyAllSelected(members);

  // 회사 전체 토글
  const handleToggleCompanyAll = (company: string, members: MemberData[]) => {
    const ids = members.map((m) => m.id);
    const companyType = members[0]?.companyType;

    setSelectedIds((prev) => {
      const currentlyAll = ids.every((id) => prev.includes(id));
      const nextChecked = !currentlyAll;

      if (nextChecked) {
        if (companyType === "client") setLocalClientCompany(company);
        return Array.from(new Set([...prev, ...ids]));
      }

      const updated = prev.filter((id) => !ids.includes(id));
      if (companyType === "client") setLocalClientCompany(null);
      return updated;
    });
  };

  // 개별 멤버 토글
  const handleToggleMember = (member: MemberData, checked: boolean) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(member.id);

      // 체크
      if (checked && !isSelected) {
        if (member.companyType === "client") setLocalClientCompany(member.company);
        return [...prev, member.id];
      }

      // 해제
      if (!checked && isSelected) {
        const updated = prev.filter((id) => id !== member.id);

        const stillRemain = updated.some((id) => {
          const m = allMembers.find((x) => x.id === id);
          return m?.company === member.company;
        });

        if (!stillRemain && member.companyType === "client") {
          setLocalClientCompany(null);
        }

        if (adminMemberId === member.id) setAdminMemberId(null);

        return updated;
      }

      return prev;
    });
  };

  // 최고권한 선택
  const handleSelectAdmin = (id: string) => {
    setAdminMemberId(id);
    if (!selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  // 회사 렌더링
  const renderCompanyGroup = (
    company: string,
    members: MemberData[],
    showAdminOption: boolean
  ) => {
    // 빈 배열이나 undefined는 렌더링하지 않음
    if (!members || members.length === 0) return null;

    const type = members[0].companyType;
    const selectable = isCompanySelectable(company, type);

    const allSelected = isCompanyAllSelected(members);
    const partial = isCompanyPartiallySelected(members);
    const checkState = allSelected ? true : partial ? "indeterminate" : false;

    const isExpanded = expandedCompanies.includes(company);

    return (
      <div key={company} className="border-b last:border-b-0">
        <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50">
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedCompanies((prev) =>
                prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]
              );
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className={selectable ? "font-medium" : "text-muted-foreground"}>
              {company}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{members.length}명</Badge>
            <Checkbox
              checked={checkState}
              onCheckedChange={() => handleToggleCompanyAll(company, members)}
              disabled={!selectable}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
            {!selectable && (
              <span className="text-xs text-muted-foreground">(다른 회사 선택됨)</span>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-3 space-y-2">
            {members.map((m) => {
              const isChecked = selectedIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-md ${
                    selectable ? "hover:bg-muted/30" : "opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`member-${m.id}`}
                      checked={isChecked}
                      onCheckedChange={(v) => handleToggleMember(m, v === true)}
                      disabled={!selectable}
                    />

                    <label htmlFor={`member-${m.id}`} className="cursor-pointer select-none">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-sm text-muted-foreground">{m.position}</div>
                    </label>
                  </div>

                  {showAdminOption && (
                    <RadioGroup value={adminMemberId || ""} onValueChange={handleSelectAdmin}>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value={m.id}
                          id={`admin-${m.id}`}
                          disabled={!selectedIds.includes(m.id)}
                        />
                        <Label
                          htmlFor={`admin-${m.id}`}
                          className={!selectedIds.includes(m.id) ? "text-muted-foreground" : ""}
                        >
                          최고권한
                        </Label>
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

  // 완료하기
  const handleConfirm = () => {
    const unique = Array.from(new Set(selectedIds));

    const result: SelectedMember[] = unique.map((id) => {
      const m = allMembers.find((x) => x.id === id)!;
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

  const handleClose = () => {
    // 선택 상태를 유지한 채 닫기
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>멤버 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
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

            <TabsContent value="agency" className="flex-1 overflow-y-auto border rounded-md mt-2">
              <div className="divide-y">
                {renderCompanyGroup("DevCorp", agencyMembers, true)}
              </div>
            </TabsContent>

            <TabsContent value="client" className="flex-1 overflow-y-auto border rounded-md mt-2">
              {Object.entries(groupedByCompany).map(([company, members]) =>
                renderCompanyGroup(company, members, false)
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            선택된 멤버: {selectedIds.length}명
            {selectedIds.some((id) => {
              const m = allMembers.find((x) => x.id === id);
              return m?.companyType === "agency";
            }) &&
              !adminMemberId && <span className="text-destructive ml-2">(개발사 최고권한자 필요)</span>}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              disabled={
                selectedIds.length === 0 ||
                (selectedIds.some((id) => allMembers.find((x) => x.id === id)?.companyType === "agency") &&
                  !adminMemberId)
              }
              onClick={handleConfirm}
            >
              추가하기
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberSelectDialog;

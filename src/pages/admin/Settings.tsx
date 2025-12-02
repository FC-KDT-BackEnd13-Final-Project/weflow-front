import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Bell, Lock, Database } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">시스템 설정</h1>
          <p className="text-muted-foreground mt-1">
            시스템 전반의 설정을 관리합니다
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 관리자 계정 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              관리자 계정 관리
            </CardTitle>
            <CardDescription>시스템 관리자 계정을 관리합니다</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 총 관리자 수 - 강조 스타일 */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">총 관리자 수</p>
              <p className="text-2xl font-bold">3명</p>
            </div>

            {/* 버튼 가로 배치 */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                관리자 목록 보기
              </Button>
              <Button className="flex-1">
                새 관리자 추가
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 보안 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              보안 설정
            </CardTitle>
            <CardDescription>계정 보안을 강화합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input id="new-password" type="password" />
            </div>
            <Button className="w-full">비밀번호 변경</Button>
          </CardContent>
        </Card>

        {/* 데이터 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              데이터 관리
            </CardTitle>
            <CardDescription>시스템 데이터를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              데이터 백업
            </Button>
            <Button variant="outline" className="w-full">
              로그 다운로드
            </Button>
            <Button variant="destructive" className="w-full">
              데이터 초기화
            </Button>
          </CardContent>
        </Card>

        {/* 시스템 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              시스템 정보
            </CardTitle>
            <CardDescription>현재 시스템 상태</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">버전</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">총 사용자</span>
              <span className="font-medium">123명</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">저장공간</span>
              <span className="font-medium">2.4GB / 10GB</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

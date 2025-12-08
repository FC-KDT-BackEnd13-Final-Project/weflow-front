import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { deleteAdminUser, getAdminUsers, type AdminUser } from "@/lib/adminUsersStore";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  useEffect(() => {
    setAdmins(getAdminUsers());
  }, []);

  const handleDelete = (id: number) => {
    deleteAdminUser(id);
    setAdmins(getAdminUsers());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">관리자 계정 관리</h1>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate("/admin/admin-users/create")}
        >
          <Plus className="h-4 w-4" />
          관리자 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>관리자 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/admin-users/${admin.id}`)}
            >
              <div>
                <div className="font-medium">{admin.name}</div>
                <div className="text-sm text-muted-foreground">{admin.email}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;

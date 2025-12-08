import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

const AddCategoryModal = ({ open, onClose, onConfirm }: AddCategoryModalProps) => {
  const [categoryName, setCategoryName] = useState("");

  const handleSubmit = () => {
    if (!categoryName.trim()) return;
    onConfirm(categoryName);
    setCategoryName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 카테고리 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Input
            placeholder="카테고리 이름 입력"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button className="bg-primary text-white" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryModal;

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
}: DeleteConfirmDialogProps) => {
  const t = useTranslations();
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (!open) {
      setIsDeleting(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("confirm")}</DialogTitle>
          <DialogDescription>
            {t("confirm")} {t("delete")}?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            className="bg-danger text-danger-foreground hover:bg-danger/80"
            onClick={() => {
              setIsDeleting(true);
              onConfirm();
            }}
          >
            {isDeleting && open && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full" />} { t("delete") }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
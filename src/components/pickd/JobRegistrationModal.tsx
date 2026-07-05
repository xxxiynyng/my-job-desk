import { useState } from "react";
import { Link2, Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JobRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
}

export function JobRegistrationModal({
  open,
  onOpenChange,
  initialUrl = "",
}: JobRegistrationModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [activeTab, setActiveTab] = useState<"url" | "pdf" | "image">("url");

  const tabs = [
    { id: "url" as const, label: "URL 입력", icon: Link2 },
    { id: "pdf" as const, label: "PDF 업로드", icon: Upload },
    { id: "image" as const, label: "이미지 업로드", icon: Image },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">공고 등록</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 bg-muted rounded-lg p-1 mt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-card text-foreground pickd-shadow font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {activeTab === "url" && (
            <div className="space-y-3">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/job-posting"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                채용 공고 페이지의 URL을 입력하면 AI가 자동으로 정보를 분석합니다.
              </p>
            </div>
          )}

          {activeTab === "pdf" && (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                PDF 파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">최대 10MB</p>
            </div>
          )}

          {activeTab === "image" && (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                스크린샷 또는 이미지를 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG 지원</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button size="sm">등록하기</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

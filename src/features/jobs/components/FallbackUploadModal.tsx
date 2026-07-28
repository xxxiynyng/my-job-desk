import { useState } from "react";
import { Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FallbackUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 검색 결과 없음 폴백 — 공고문 PDF/이미지 직접 등록.
 * 검색 DB에 없는 공고(사기업 등)만 이 경로로 들어온다.
 * 메인 동선에는 노출하지 않는다(검색 드롭다운 하단 링크에서만 진입).
 */
export function FallbackUploadModal({ open, onOpenChange }: FallbackUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"pdf" | "image">("pdf");

  const tabs = [
    { id: "pdf" as const, label: "PDF 업로드", icon: Upload },
    { id: "image" as const, label: "이미지 업로드", icon: Image },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-title">공고 직접 등록</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          검색에서 찾지 못한 공고는 공고문 파일로 등록할 수 있어요. 등록한 공고는 검토 후
          검색에도 추가돼요.
        </p>

        <div className="flex gap-1 bg-muted rounded-lg p-1 mt-1">
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

        <div className="mt-3">
          {activeTab === "pdf" ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">PDF 파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs text-muted-foreground/70 mt-1">최대 10MB</p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">스크린샷 또는 이미지를 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG 지원</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            size="sm"
            onClick={() => {
              toast("파일 등록은 준비 중이에요 — 곧 열릴 예정이에요", { duration: 2000 });
            }}
          >
            등록하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { PickdSidebar } from "@/components/pickd/PickdSidebar";
import { Sparkles } from "lucide-react";

export default function AICover() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PickdSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-10 py-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">AI 자소서</h1>
            <p className="text-sm text-muted-foreground mt-1">
              정리한 경험을 활용해 자기소개서 초안을 작성해보세요.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center text-center py-20 border border-dashed border-border rounded-xl bg-card">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">AI 자소서 작성은 곧 제공돼요.</p>
            <p className="text-xs text-muted-foreground mt-1">경험정리에 등록된 내용을 기반으로 초안을 생성할 예정입니다.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

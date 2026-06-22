import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobRegistrationModal } from "./JobRegistrationModal";

export function QuickJobRegistration() {
  const [url, setUrl] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 pickd-shadow">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="채용공고 검색하기"
          className="border-0 shadow-none bg-transparent h-8 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 px-0"
        />
        <Button
          size="sm"
          className="h-8 px-4 text-xs gap-1.5 shrink-0"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          공고 등록
        </Button>
      </div>

      <JobRegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialUrl={url}
      />
    </>
  );
}

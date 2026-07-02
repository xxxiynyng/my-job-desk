import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const quotes = [
  "어제의 나보다 오늘의 내가 더 낫다면, 그걸로 충분해요.",
  "완벽한 준비보다 꾸준한 한 발짝이 더 중요합니다.",
  "합격은 노력이 방향을 만났을 때 찾아옵니다.",
  "지금 이 순간에도 성장하고 있어요. 🌱",
  "쉬어가도 괜찮아요. 잠깐의 휴식도 전략입니다.",
  "당신의 가치는 합격 여부로 결정되지 않아요.",
  "오늘의 노력은 내일의 기회가 됩니다.",
];

export function MoodRefresh() {
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState("");

  const handleClick = () => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:ring-2 hover:ring-primary/20 transition-all ml-1"
        title="기분 전환"
      >
        <img src="/logo-mark.svg" alt="" className="w-4 h-auto" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/5 backdrop-blur-[2px] z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="fixed top-24 right-8 z-50 bg-card border border-border rounded-xl p-6 pickd-shadow-md max-w-sm"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {quote}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    — Pickd가 응원합니다
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

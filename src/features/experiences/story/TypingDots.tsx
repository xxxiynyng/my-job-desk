// AI가 생각 중임을 알리는 3점 인디케이터. 인터뷰·추출 두 화면이 같은 span 3개를 쓴다.
// 감싸는 컨테이너(테두리·여백)는 호출부가 그대로 소유한다 — 여기는 점 3개뿐이다.
export function TypingDots() {
  return (
    <>
      <span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
      <span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-primary/50 animate-pulse [animation-delay:300ms]" />
    </>
  );
}

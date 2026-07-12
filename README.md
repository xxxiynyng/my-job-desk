# Pickd (My Job Desk)

취업 준비용 개인 지원 관리 앱 — 공고·일정·경험·스펙을 한 곳에서 관리하고, 경험을 자산화해 자소서에 재사용합니다.

- **라이브**: https://pickd-seven.vercel.app (main 브랜치 push 시 Vercel 자동 배포)
- **스택**: React 18 + TypeScript + Vite · Tailwind CSS + shadcn/ui · localStorage (현재 백엔드 없음)

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm test           # vitest
npx tsc -p tsconfig.app.json --noEmit   # 타입 체크
```

## 문서

- 작업·코드 규칙: [`CLAUDE.md`](./CLAUDE.md) — 이 레포의 유일한 규칙 정본 (지침 지도 포함)
- 기획·디자인·온보딩: Notion SSOT (`CLAUDE.md`의 지침 지도 참조)

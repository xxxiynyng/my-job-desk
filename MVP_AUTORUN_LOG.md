# MVP 자율주행 로그

## Phase 1 — 프로토타입 동작 확인

| 항목 | 결과 | 비고 |
|------|------|------|
| npm install | ✅ 통과 | 보안 취약점 18개(npm audit 권고, 기능 영향 없음) |
| tsc --noEmit | ✅ 수정 후 0 에러 | Tabs.tsx onChange 타입 충돌 → Omit 패치 |
| npm run build | ✅ 통과 | 번들 843KB (code-split 고려 필요, 기능 영향 없음) |
| npm run test | ✅ 1/1 통과 | |
| 라우트 확인 | ✅ 소스 구조 정상 | / /jobs/:slug /experiences /calendar /settings |

커밋: (P1 커밋 후 해시 기록)

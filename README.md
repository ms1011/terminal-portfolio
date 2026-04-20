# terminal-portfolio

백엔드 개발자 포트폴리오 사이트 — CRT 터미널 테마

> YAPP 지원용으로 기획된 실시간 포트폴리오 사이트.  
> 사이트 자체가 기술 데모다.

## 기술 스펙

- **Backend** — Spring Boot 3.x + Kotlin
- **실시간** — SSE (타이핑 인트로) + WebSocket (방문자 현황)
- **Frontend** — React + TypeScript + Vite
- **배포** — Vercel (FE) + 맥미니 홈 서버 / Docker + Nginx (BE)

## 주요 기능

| 기능 | 설명 |
|------|------|
| SSE 타이핑 인트로 | 접속 시 자기소개가 한 글자씩 스트리밍 |
| 실시간 방문자 현황 | 지금 같은 화면을 보고 있는 방문자 목록 실시간 표시 |
| 터미널 명령어 네비 | `cd /projects`, `ls`, `cat` 으로 섹션 이동 |
| CRT 터미널 UI | 초록/흰색 monospace, scanline 효과 |

## 문서

- [`docs/웹기획서_포트폴리오사이트_20260421.md`](docs/웹기획서_포트폴리오사이트_20260421.md) — 통합 기획서
- [`docs/workspace/01_service_overview.md`](docs/workspace/01_service_overview.md) — 서비스 개요
- [`docs/workspace/02_screen_design.md`](docs/workspace/02_screen_design.md) — 화면 설계
- [`docs/workspace/03_tech_spec.md`](docs/workspace/03_tech_spec.md) — 기술 명세

## 구현 예정

- [ ] Kotlin + Spring Boot 프로젝트 셋업
- [ ] WebSocket presence 서버
- [ ] SSE 타이핑 스트림
- [ ] React CRT UI
- [ ] 맥미니 Docker 배포

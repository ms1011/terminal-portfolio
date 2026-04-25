# Gmail 앱 비밀번호 설정 가이드

이 작업만 완료하면 방문자 접속 시 이메일 알림이 활성화됩니다.

---

## 1단계: Gmail 앱 비밀번호 발급 (1회)

1. https://myaccount.google.com/security 접속
2. **2단계 인증** 활성화 확인 (이미 켜져 있으면 스킵)
3. 검색창에 **앱 비밀번호** 입력 → 선택
4. 앱 이름에 `portfolio-api` 입력 → 생성
5. **16자리 비밀번호 복사** (이 창 닫으면 다시 볼 수 없음)

---

## 2단계: 로컬 테스트 (선택)

백엔드를 직접 띄워서 이메일이 오는지 확인하고 싶을 때:

```bash
cd /Users/ms/Projects/terminal-portfolio/backend
MAIL_PASSWORD="여기에16자리붙여넣기" ./gradlew bootRun
```

브라우저에서 `http://localhost:5173` 열기 → `msjang.dev@gmail.com` 수신함 확인.

---

## 3단계: 프로덕션 배포 환경에 설정

백엔드를 배포한 플랫폼(Railway, Render, Fly.io 등)의 **환경변수** 설정에서:

| 키 | 값 |
|----|----|
| `MAIL_PASSWORD` | 1단계에서 발급받은 16자리 |

설정 후 서버 재시작하면 완료.

---

## 완료 확인

포트폴리오 사이트에 접속하면 수 초 내로 `msjang.dev@gmail.com`으로 아래 형식의 이메일이 도착합니다:

```
제목: [Portfolio] 새 방문자 접속
본문: 접속 시각: 2026-04-26 14:32:01 KST
```

---

> **주의:** `MAIL_PASSWORD`는 절대 코드나 git에 커밋하지 마세요.

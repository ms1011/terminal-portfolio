# Visitor Email Notification — Design Spec

**Date:** 2026-04-26  
**Status:** Approved

## Goal

Send an immediate email to the portfolio owner (msjang.dev@gmail.com) whenever a new visitor connects to the terminal portfolio site via WebSocket, so the owner can open the site and monitor the visitor's activity in real time.

## Scope

- Trigger: visitor WebSocket connection (`presence.join` event)
- Email content: connection timestamp only (simple format)
- Transport: Gmail SMTP via `spring-boot-starter-mail`
- Recipient: hardcoded owner email, configurable via `application.yml`
- Sending: asynchronous (non-blocking for WebSocket handshake)

## Architecture

The existing `PresenceController.onConnect()` already fires on every WebSocket connect. We inject `JavaMailSender` into this controller and call a private async helper after the presence broadcast.

```
Visitor connects (WebSocket)
  → PresenceController.onConnect()
      → registry.register()         (existing)
      → broadcast(SessionAssigned)  (existing)
      → broadcast(PresenceJoin)     (existing)
      → sendVisitorNotification()   (NEW, @Async)
            → JavaMailSender.send()
                → Gmail SMTP → owner inbox
```

## Changed Files

| File | Change |
|------|--------|
| `backend/build.gradle.kts` | Add `spring-boot-starter-mail` dependency |
| `backend/src/main/resources/application.yml` | Add `spring.mail.*` SMTP config + `app.notification.*` properties |
| `backend/src/main/kotlin/.../config/AppProperties.kt` | Add `NotificationProperties(to, enabled)` data class |
| `backend/src/main/kotlin/.../presence/PresenceController.kt` | Inject `JavaMailSender`, call async mail send in `onConnect` |
| `backend/src/main/kotlin/.../PortfolioApiApplication.kt` | Add `@EnableAsync` |

## Configuration

### application.yml additions

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: msjang.dev@gmail.com
    password: ${MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true

app:
  notification:
    enabled: true
    to: msjang.dev@gmail.com
```

`MAIL_PASSWORD` is a Gmail App Password (not the account password). It must be set as an environment variable and must never be committed to git.

### Gmail App Password setup (one-time manual step)

1. Google Account → Security → 2-Step Verification (enable if not already)
2. Security → App passwords → create one named "portfolio-api"
3. Set the generated 16-character password as `MAIL_PASSWORD` in the server environment

## Email Format

```
Subject: [Portfolio] 새 방문자 접속
Body:    접속 시각: 2026-04-26 14:32:01 KST
```

Timezone: Asia/Seoul (KST)

## Error Handling

Mail send failures (SMTP timeout, auth error, etc.) are caught and logged at WARN level. They must not propagate exceptions that could disrupt WebSocket session establishment.

## What Is NOT in Scope

- Per-command or per-path-change notifications
- Visitor activity summary on disconnect
- Rate limiting of notification emails (visitor count is expected to be low)
- Frontend changes

## Testing

Manual smoke test: connect to the running app locally with `MAIL_PASSWORD` set → confirm email arrives in inbox within a few seconds.

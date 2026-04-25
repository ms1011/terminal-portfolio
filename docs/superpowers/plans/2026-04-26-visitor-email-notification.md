# Visitor Email Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send an immediate email to msjang.dev@gmail.com whenever a new visitor connects to the portfolio site via WebSocket.

**Architecture:** `spring-boot-starter-mail` is added to the existing Spring Boot backend. A new `VisitorNotifier` component handles async email dispatch so the WebSocket handshake is never blocked. `PresenceController.onConnect()` calls `notifier.sendEmail(session)` after completing its existing broadcast logic.

**Tech Stack:** Spring Boot 3.5 (Kotlin), spring-boot-starter-mail, Gmail SMTP (port 587 / STARTTLS), JUnit 5 + Mockito (unit tests)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `backend/build.gradle.kts` | Add `spring-boot-starter-mail`, `mockito-kotlin` |
| Modify | `backend/src/main/resources/application.yml` | Gmail SMTP config + `app.notification` properties |
| Modify | `backend/src/main/kotlin/dev/msjang/portfolio/config/AppProperties.kt` | Add `NotificationProperties` data class |
| Modify | `backend/src/main/kotlin/dev/msjang/portfolio/PortfolioApiApplication.kt` | Add `@EnableAsync` |
| Create | `backend/src/main/kotlin/dev/msjang/portfolio/presence/VisitorNotifier.kt` | Async email dispatch logic |
| Create | `backend/src/test/kotlin/dev/msjang/portfolio/presence/VisitorNotifierTest.kt` | Unit tests for VisitorNotifier |
| Modify | `backend/src/main/kotlin/dev/msjang/portfolio/presence/PresenceController.kt` | Inject VisitorNotifier, call in onConnect |

---

### Task 1: Add dependencies

**Files:**
- Modify: `backend/build.gradle.kts`

- [ ] **Step 1: Add dependencies**

In `backend/build.gradle.kts`, add to the `dependencies` block:

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-mail")   // ADD THIS
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")          // ADD THIS
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
```

- [ ] **Step 2: Verify build resolves dependencies**

```bash
cd backend && ./gradlew dependencies --configuration runtimeClasspath | grep mail
```

Expected output includes:
```
org.springframework.boot:spring-boot-starter-mail:3.5.x
```

- [ ] **Step 3: Commit**

```bash
git add backend/build.gradle.kts
git commit -m "build: add spring-boot-starter-mail and mockito-kotlin"
```

---

### Task 2: Add configuration

**Files:**
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/kotlin/dev/msjang/portfolio/config/AppProperties.kt`

- [ ] **Step 1: Add NotificationProperties to AppProperties.kt**

Replace the entire file content:

```kotlin
package dev.msjang.portfolio.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Configuration

@ConfigurationProperties(prefix = "app.cors")
data class CorsProperties(val allowedOrigins: List<String> = emptyList())

@ConfigurationProperties(prefix = "app.intro")
data class IntroProperties(
    val tokenDelayMinMs: Long = 30,
    val tokenDelayMaxMs: Long = 60,
    val newlinePauseMs: Long = 500,
)

@ConfigurationProperties(prefix = "app.presence")
data class PresenceProperties(
    val heartbeatIntervalMs: Long = 10000,
    val waveRateLimit: Int = 5,
)

@ConfigurationProperties(prefix = "app.notification")
data class NotificationProperties(
    val enabled: Boolean = true,
    val to: String = "",
)

@Configuration
@EnableConfigurationProperties(
    CorsProperties::class,
    IntroProperties::class,
    PresenceProperties::class,
    NotificationProperties::class,
)
class AppPropertiesConfig
```

- [ ] **Step 2: Add mail + notification config to application.yml**

Append to the end of `backend/src/main/resources/application.yml`:

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: msjang.dev@gmail.com
    password: ${MAIL_PASSWORD:}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true

app:
  notification:
    enabled: true
    to: msjang.dev@gmail.com
```

Note: `${MAIL_PASSWORD:}` defaults to empty string when the env var is missing, so the app starts without crashing in test/CI environments.

- [ ] **Step 3: Verify context loads**

```bash
cd backend && ./gradlew test --tests "dev.msjang.portfolio.PortfolioApiApplicationTests"
```

Expected: PASS (context loads without errors)

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/resources/application.yml \
        backend/src/main/kotlin/dev/msjang/portfolio/config/AppProperties.kt
git commit -m "config: add NotificationProperties and Gmail SMTP settings"
```

---

### Task 3: Write the failing test

**Files:**
- Create: `backend/src/test/kotlin/dev/msjang/portfolio/presence/VisitorNotifierTest.kt`

- [ ] **Step 1: Create the test file**

```kotlin
package dev.msjang.portfolio.presence

import dev.msjang.portfolio.config.NotificationProperties
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentCaptor
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender

@ExtendWith(MockitoExtension::class)
class VisitorNotifierTest {

    @Mock
    private lateinit var mailSender: JavaMailSender

    @Test
    fun `sendEmail sends to configured address when enabled`() {
        val props = NotificationProperties(to = "owner@example.com", enabled = true)
        val notifier = VisitorNotifier(mailSender, props)
        val captor = ArgumentCaptor.forClass(SimpleMailMessage::class.java)

        notifier.sendEmail(PresenceSession(sessionId = "s1", nickname = "visitor_1"))

        verify(mailSender).send(captor.capture())
        val sent = captor.value
        assert(sent.to?.contains("owner@example.com") == true) { "wrong recipient" }
        assert(sent.subject?.contains("Portfolio") == true) { "subject missing Portfolio" }
        assert(sent.text?.contains("접속 시각") == true) { "body missing 접속 시각" }
    }

    @Test
    fun `sendEmail is no-op when disabled`() {
        val props = NotificationProperties(to = "owner@example.com", enabled = false)
        val notifier = VisitorNotifier(mailSender, props)

        notifier.sendEmail(PresenceSession(sessionId = "s1", nickname = "visitor_1"))

        verify(mailSender, never()).send(any<SimpleMailMessage>())
    }
}
```

- [ ] **Step 2: Run test to confirm it fails (VisitorNotifier doesn't exist yet)**

```bash
cd backend && ./gradlew test --tests "dev.msjang.portfolio.presence.VisitorNotifierTest"
```

Expected: FAIL with `error: unresolved reference: VisitorNotifier`

---

### Task 4: Implement VisitorNotifier

**Files:**
- Create: `backend/src/main/kotlin/dev/msjang/portfolio/presence/VisitorNotifier.kt`
- Add `@EnableAsync` to `PortfolioApiApplication.kt`

- [ ] **Step 1: Create VisitorNotifier.kt**

```kotlin
package dev.msjang.portfolio.presence

import dev.msjang.portfolio.config.NotificationProperties
import org.slf4j.LoggerFactory
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

@Component
class VisitorNotifier(
    private val mailSender: JavaMailSender,
    private val props: NotificationProperties,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Async
    fun sendEmail(session: PresenceSession) {
        if (!props.enabled || props.to.isBlank()) return
        val time = ZonedDateTime.now(ZoneId.of("Asia/Seoul"))
            .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z"))
        val msg = SimpleMailMessage()
        msg.setTo(props.to)
        msg.subject = "[Portfolio] 새 방문자 접속"
        msg.text = "접속 시각: $time"
        try {
            mailSender.send(msg)
        } catch (e: Exception) {
            log.warn("Failed to send visitor notification: ${e.message}")
        }
    }
}
```

- [ ] **Step 2: Add @EnableAsync to PortfolioApiApplication.kt**

Replace the file content:

```kotlin
package dev.msjang.portfolio

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
@EnableAsync
class PortfolioApiApplication

fun main(args: Array<String>) {
    runApplication<PortfolioApiApplication>(*args)
}
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cd backend && ./gradlew test --tests "dev.msjang.portfolio.presence.VisitorNotifierTest"
```

Expected:
```
VisitorNotifierTest > sendEmail sends to configured address when enabled PASSED
VisitorNotifierTest > sendEmail is no-op when disabled PASSED
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/kotlin/dev/msjang/portfolio/presence/VisitorNotifier.kt \
        backend/src/main/kotlin/dev/msjang/portfolio/PortfolioApiApplication.kt \
        backend/src/test/kotlin/dev/msjang/portfolio/presence/VisitorNotifierTest.kt
git commit -m "feat: add VisitorNotifier for async email on visitor connect"
```

---

### Task 5: Wire VisitorNotifier into PresenceController

**Files:**
- Modify: `backend/src/main/kotlin/dev/msjang/portfolio/presence/PresenceController.kt`

- [ ] **Step 1: Inject VisitorNotifier and call it in onConnect**

Replace the entire file content:

```kotlin
package dev.msjang.portfolio.presence

import dev.msjang.portfolio.config.PresenceProperties
import org.springframework.context.event.EventListener
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Controller
import org.springframework.web.socket.messaging.SessionConnectedEvent
import org.springframework.web.socket.messaging.SessionDisconnectEvent
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

@Controller
class PresenceController(
    private val registry: PresenceSessionRegistry,
    private val messaging: SimpMessagingTemplate,
    private val props: PresenceProperties,
    private val notifier: VisitorNotifier,
) {
    private val waveCounters = ConcurrentHashMap<String, MutableList<Long>>()
    private val commandCounters = ConcurrentHashMap<String, MutableList<Long>>()

    @EventListener
    fun onConnect(event: SessionConnectedEvent) {
        val sessionId = SimpMessageHeaderAccessor.wrap(event.message).sessionId ?: return
        val session = registry.register(sessionId)

        messaging.convertAndSend("/topic/presence", SessionAssigned(nick = session.nickname, sid = sessionId))
        messaging.convertAndSend("/topic/presence", registry.snapshot())
        broadcast(PresenceJoin(nick = session.nickname, path = session.currentPath))
        notifier.sendEmail(session)
    }

    @EventListener
    fun onDisconnect(event: SessionDisconnectEvent) {
        val session = registry.remove(event.sessionId) ?: return
        waveCounters.remove(event.sessionId)
        commandCounters.remove(event.sessionId)
        broadcast(PresenceLeave(nick = session.nickname))
    }

    @MessageMapping("/presence/path")
    fun onPathChange(request: PathChangeRequest, accessor: SimpMessageHeaderAccessor) {
        val sessionId = accessor.sessionId ?: return
        val session = registry.move(sessionId, request.path) ?: return
        broadcast(PresenceMove(nick = session.nickname, path = request.path))
    }

    @MessageMapping("/presence/wave")
    fun onWave(accessor: SimpMessageHeaderAccessor) {
        val sessionId = accessor.sessionId ?: return
        if (!checkWaveRateLimit(sessionId)) return
        val session = registry.recordWave(sessionId) ?: return
        broadcast(VisitorWave(from = session.nickname))
    }

    @MessageMapping("/presence/pong")
    fun onPong() { /* keep-alive ack */ }

    @MessageMapping("/presence/command")
    fun onCommand(request: CommandRequest, accessor: SimpMessageHeaderAccessor) {
        val sessionId = accessor.sessionId ?: return
        val session = registry.findById(sessionId) ?: return
        if (request.cmd.isBlank() || request.cmd.length > 200) return
        if (!checkCommandRateLimit(sessionId)) return
        broadcast(CommandBroadcast(nick = session.nickname, cmd = request.cmd))
    }

    @Scheduled(fixedDelayString = "\${app.presence.heartbeat-interval-ms}")
    fun heartbeat() = broadcast(ServerHeartbeat(uptimeMs = registry.uptimeMs()))

    private fun broadcast(payload: Any) = messaging.convertAndSend("/topic/presence", payload)

    private fun checkWaveRateLimit(sessionId: String): Boolean {
        val now = Instant.now().toEpochMilli()
        val window = waveCounters.getOrPut(sessionId) { mutableListOf() }
        window.removeAll { now - it > 60_000 }
        if (window.size >= props.waveRateLimit) return false
        window.add(now)
        return true
    }

    private fun checkCommandRateLimit(sessionId: String): Boolean {
        val now = Instant.now().toEpochMilli()
        val window = commandCounters.getOrPut(sessionId) { mutableListOf() }
        window.removeAll { now - it > 60_000 }
        if (window.size >= props.waveRateLimit) return false
        window.add(now)
        return true
    }
}
```

- [ ] **Step 2: Run all tests**

```bash
cd backend && ./gradlew test
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/kotlin/dev/msjang/portfolio/presence/PresenceController.kt
git commit -m "feat: wire VisitorNotifier into PresenceController.onConnect"
```

---

### Task 6: Gmail App Password setup + smoke test

This task is manual. No code changes.

- [ ] **Step 1: Create Gmail App Password**

1. Go to https://myaccount.google.com/security
2. Ensure **2-Step Verification** is enabled (required for App Passwords)
3. Search for **App passwords** in the search bar
4. Create a new app password — name it `portfolio-api`
5. Copy the generated 16-character password (shown once)

- [ ] **Step 2: Set env var and start the backend**

```bash
cd backend
MAIL_PASSWORD="<16-char-app-password>" ./gradlew bootRun
```

Expected: server starts on port 8080 with no mail-related errors in logs.

- [ ] **Step 3: Trigger a connection**

Open the frontend in a browser (`http://localhost:5173`) — or open a second browser tab. A WebSocket connection is established automatically on page load.

- [ ] **Step 4: Verify email arrives**

Check msjang.dev@gmail.com inbox. Within ~5 seconds an email should arrive:

```
Subject: [Portfolio] 새 방문자 접속
Body:    접속 시각: 2026-04-26 14:32:01 KST
```

- [ ] **Step 5: Check backend log for any WARN entries**

```
grep -i "mail\|notif" backend/logs/spring.log
```

No WARN lines should appear on a successful send.

---

## Production Deployment Note

Set `MAIL_PASSWORD` as a secret environment variable in your hosting environment (e.g., Railway, Fly.io, Render). Never commit the value to git. The app starts safely with an empty password — emails are simply not sent, and a WARN is logged if someone connects.

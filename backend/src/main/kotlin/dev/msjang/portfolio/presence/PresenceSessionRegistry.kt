package dev.msjang.portfolio.presence

import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

@Component
class PresenceSessionRegistry {

    private val sessions = ConcurrentHashMap<String, PresenceSession>()
    private val activityBuffer = ArrayDeque<ActivityLog>(50)
    private val counter = AtomicInteger(0)
    private val startedAt = Instant.now().toEpochMilli()

    fun register(sessionId: String): PresenceSession {
        val n = counter.incrementAndGet()
        val session = PresenceSession(
            sessionId = sessionId,
            nickname = "visitor_$n",
        )
        sessions[sessionId] = session
        log(ActivityLog(id = uuid(), type = "join", nickname = session.nickname, path = session.currentPath))
        return session
    }

    fun remove(sessionId: String): PresenceSession? {
        val session = sessions.remove(sessionId) ?: return null
        log(ActivityLog(id = uuid(), type = "leave", nickname = session.nickname))
        return session
    }

    fun move(sessionId: String, path: String): PresenceSession? {
        val session = sessions[sessionId] ?: return null
        session.currentPath = path
        session.lastMoveAt = Instant.now().toEpochMilli()
        log(ActivityLog(id = uuid(), type = "move", nickname = session.nickname, path = path))
        return session
    }

    fun recordWave(sessionId: String): PresenceSession? {
        val session = sessions[sessionId] ?: return null
        log(ActivityLog(id = uuid(), type = "wave", nickname = session.nickname))
        return session
    }

    fun all(): List<PresenceSession> = sessions.values.toList()

    fun snapshot(): PresenceSnapshot {
        val now = Instant.now().toEpochMilli()
        return PresenceSnapshot(
            users = sessions.values.map { s ->
                PresenceUser(nick = s.nickname, path = s.currentPath, idleMs = now - s.lastMoveAt)
            },
            recentLogs = activityBuffer.toList().takeLast(50),
        )
    }

    fun uptimeMs() = Instant.now().toEpochMilli() - startedAt

    private fun log(entry: ActivityLog) {
        if (activityBuffer.size >= 50) activityBuffer.removeFirst()
        activityBuffer.addLast(entry)
    }

    private fun uuid() = UUID.randomUUID().toString()
}

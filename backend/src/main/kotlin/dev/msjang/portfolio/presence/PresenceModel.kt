package dev.msjang.portfolio.presence

import java.time.Instant

data class PresenceSession(
    val sessionId: String,
    val nickname: String,
    var currentPath: String = "/intro",
    val connectedAt: Long = Instant.now().toEpochMilli(),
    var lastMoveAt: Long = Instant.now().toEpochMilli(),
)

data class ActivityLog(
    val id: String,
    val type: String,   // join | leave | move | wave
    val nickname: String,
    val path: String? = null,
    val timestamp: Long = Instant.now().toEpochMilli(),
)

// ── STOMP payloads ──────────────────────────────────────────

data class SessionAssigned(val event: String = "session.assigned", val nick: String, val sid: String)

data class PresenceUser(val nick: String, val path: String, val idleMs: Long)

data class PresenceSnapshot(
    val event: String = "presence.snapshot",
    val users: List<PresenceUser>,
    val recentLogs: List<ActivityLog>,
)

data class PresenceJoin(val event: String = "presence.join", val nick: String, val path: String)
data class PresenceLeave(val event: String = "presence.leave", val nick: String)
data class PresenceMove(val event: String = "presence.move", val nick: String, val path: String)
data class VisitorWave(val event: String = "visitor.wave", val from: String)
data class ServerHeartbeat(val event: String = "server.heartbeat", val uptimeMs: Long)

// ── Client → Server payloads ────────────────────────────────

data class PathChangeRequest(val path: String = "/intro")

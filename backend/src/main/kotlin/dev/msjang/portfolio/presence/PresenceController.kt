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

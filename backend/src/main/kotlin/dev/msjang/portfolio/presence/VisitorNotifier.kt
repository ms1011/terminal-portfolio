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

package dev.msjang.portfolio.presence

import dev.msjang.portfolio.config.NotificationProperties
import org.junit.jupiter.api.Disabled
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

@Disabled("visitor email notification disabled")
@ExtendWith(MockitoExtension::class)
class VisitorNotifierTest {

    @Mock
    private lateinit var mailSender: JavaMailSender

    @Test
    fun `sendEmail sends to configured address when enabled`() {
        val props = NotificationProperties(to = "owner@example.com", enabled = true, from = "sender@example.com")
        val notifier = VisitorNotifier(mailSender, props)
        val captor = ArgumentCaptor.forClass(SimpleMailMessage::class.java)

        notifier.sendEmail(PresenceSession(sessionId = "s1", nickname = "visitor_1"))

        verify(mailSender).send(captor.capture())
        val sent = captor.value
        assert(sent.to?.contains("owner@example.com") == true) { "wrong recipient" }
        assert(sent.from == "sender@example.com") { "wrong from address" }
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

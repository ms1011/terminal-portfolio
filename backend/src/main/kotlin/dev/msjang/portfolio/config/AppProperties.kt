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
    val from: String = "",
)

@Configuration
@EnableConfigurationProperties(
    CorsProperties::class,
    IntroProperties::class,
    PresenceProperties::class,
    NotificationProperties::class,
)
class AppPropertiesConfig

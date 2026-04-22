package dev.msjang.portfolio.intro

import dev.msjang.portfolio.config.IntroProperties
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.io.IOException
import java.util.concurrent.Executors

@RestController
@RequestMapping("/api/intro")
class IntroController(private val props: IntroProperties) {

    private val executor = Executors.newVirtualThreadPerTaskExecutor()

    @GetMapping("/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(): SseEmitter {
        val emitter = SseEmitter(30_000L)
        val start = System.currentTimeMillis()

        executor.submit {
            try {
                for (line in INTRO_LINES) {
                    for (ch in line) {
                        emitter.send(SseEmitter.event().name("token").data(mapOf("t" to ch.toString())))
                        val delay = props.tokenDelayMinMs +
                            (Math.random() * (props.tokenDelayMaxMs - props.tokenDelayMinMs)).toLong()
                        Thread.sleep(delay)
                    }
                    emitter.send(SseEmitter.event().name("newline").data(emptyMap<String, Any>()))
                    Thread.sleep(props.newlinePauseMs)
                }
                emitter.send(
                    SseEmitter.event()
                        .name("done")
                        .data(mapOf("durationMs" to System.currentTimeMillis() - start))
                )
                emitter.complete()
            } catch (_: IOException) {
                emitter.completeWithError(IOException("client disconnected"))
            }
        }

        return emitter
    }

    @PostMapping("/skip")
    fun skip(): ResponseEntity<Void> = ResponseEntity.noContent().build()
}

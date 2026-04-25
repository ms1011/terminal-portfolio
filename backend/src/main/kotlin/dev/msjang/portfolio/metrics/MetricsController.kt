package dev.msjang.portfolio.metrics

import io.micrometer.core.instrument.MeterRegistry
import jakarta.annotation.PreDestroy
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.io.IOException
import java.util.concurrent.Executors

@RestController
@RequestMapping("/api/metrics")
class MetricsController(private val registry: MeterRegistry) {

    private val executor = Executors.newVirtualThreadPerTaskExecutor()
    private val startedAt = java.lang.management.ManagementFactory.getRuntimeMXBean().startTime

    @PreDestroy
    fun shutdownExecutor() {
        executor.shutdown()
    }

    @GetMapping("/stream", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(): SseEmitter {
        val emitter = SseEmitter(60_000L)

        val future = executor.submit {
            try {
                while (!Thread.interrupted()) {
                    val heapUsed = registry.find("jvm.memory.used").tag("area", "heap").gauge()?.value() ?: 0.0
                    val heapMax  = registry.find("jvm.memory.max").tag("area", "heap").gauge()?.value() ?: 0.0
                    val cpu      = registry.find("process.cpu.usage").gauge()?.value() ?: 0.0
                    val reqCount = registry.find("http.server.requests").timer()?.count() ?: 0L

                    emitter.send(
                        SseEmitter.event().name("metrics").data(mapOf(
                            "heapUsedMb" to (heapUsed / 1024 / 1024).toLong(),
                            "heapMaxMb"  to (heapMax  / 1024 / 1024).toLong(),
                            "heapPct"    to if (heapMax > 0) (heapUsed / heapMax * 100).toInt() else 0,
                            "cpuPct"     to (cpu * 100).toInt().coerceIn(0, 100),
                            "reqCount"   to reqCount,
                            "uptimeMs"   to System.currentTimeMillis() - startedAt,
                        ))
                    )
                    Thread.sleep(1000)
                }
            } catch (_: IOException) {
                // client disconnected — emitter already done
            } catch (_: InterruptedException) {
                emitter.complete()
            }
        }

        emitter.onTimeout { future.cancel(true) }
        emitter.onCompletion { future.cancel(true) }

        return emitter
    }
}

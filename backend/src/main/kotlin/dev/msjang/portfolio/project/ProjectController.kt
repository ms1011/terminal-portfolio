package dev.msjang.portfolio.project

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class ProjectMetric(val label: String, val before: String, val after: String)
data class ProjectSummary(val problem: String, val solution: String, val result: String)
data class Project(
    val slug: String,
    val title: String,
    val summary: ProjectSummary,
    val period: String,
    val stack: List<String>,
    val metrics: List<ProjectMetric>,
)

@RestController
@RequestMapping("/api")
class ProjectController {

    private val projects = listOf(
        Project(
            slug = "zendesk-websocket",
            title = "Zendesk Rate Limit → WebSocket 전환",
            summary = ProjectSummary(
                problem  = "Zendesk API rate-limit으로 실시간 대시보드 지연 평균 8s",
                solution = "Polling → WebSocket 양방향 전환 + Redis Stream 백프레셔",
                result   = "지연 8s → 120ms, API 호출 92% 감소",
            ),
            period = "2023.02 ~ 2023.07",
            stack  = listOf("Java", "Spring Boot", "WebSocket", "Redis"),
            metrics = listOf(
                ProjectMetric("latency p95",  "8.4s",    "120ms"),
                ProjectMetric("api calls/day","420,000", "33,600"),
                ProjectMetric("error rate",   "2.1%",    "0.04%"),
            ),
        ),
        Project(
            slug = "redis-shedlock",
            title = "Redis + ShedLock 분산 락",
            summary = ProjectSummary(
                problem  = "배치 다중 인스턴스 중복 실행",
                solution = "Redis + ShedLock 기반 분산 락 도입",
                result   = "중복 0건, 스케줄 SLA 99.9% 달성",
            ),
            period = "2023.08 ~ 2023.10",
            stack  = listOf("Java", "Spring Batch", "Redis", "ShedLock"),
            metrics = listOf(
                ProjectMetric("duplicate runs", "~12/day",  "0"),
                ProjectMetric("schedule SLA",   "94.2%",    "99.9%"),
                ProjectMetric("lock acquire",   "N/A",      "< 5ms"),
            ),
        ),
        Project(
            slug = "ai-harness",
            title = "AI 생산성 시스템",
            summary = ProjectSummary(
                problem  = "개인 지식 파편화 + 반복작업 과부하",
                solution = "Obsidian + Claude Code 오케스트레이션",
                result   = "주간 산출물 3.4×, 반복작업 주 6h 절감",
            ),
            period = "2024.12 ~ present",
            stack  = listOf("Obsidian", "Claude Code", "Markdown", "Python"),
            metrics = listOf(
                ProjectMetric("weekly docs",       "1x",        "3.4x"),
                ProjectMetric("repetitive tasks",  "6h/week",   "~0h"),
                ProjectMetric("retrieval",         "manual",    "AI-assisted"),
            ),
        ),
    )

    @GetMapping("/projects")
    fun list() = projects

    @GetMapping("/meta")
    fun meta() = mapOf(
        "version"  to "1.0.0",
        "bootAt"   to java.time.Instant.now().toString(),
        "uptimeMs" to 0L,
    )
}

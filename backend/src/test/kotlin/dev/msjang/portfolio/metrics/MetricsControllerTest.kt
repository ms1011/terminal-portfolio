package dev.msjang.portfolio.metrics

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.request
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
class MetricsControllerTest {

    @Autowired lateinit var mvc: MockMvc

    @Test
    fun `stream endpoint returns text event stream content type`() {
        mvc.perform(
            get("/api/metrics/stream")
                .accept(MediaType.TEXT_EVENT_STREAM)
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("text/event-stream")))
            .andExpect(request().asyncStarted())
    }
}

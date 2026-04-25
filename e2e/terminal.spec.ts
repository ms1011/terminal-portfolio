import { test, expect, type Page } from '@playwright/test'

async function runCmd(page: Page, cmd: string) {
  const input = page.locator('input[type="text"]').last()
  await input.click()
  await input.fill(cmd)
  await input.press('Enter')
  await page.waitForTimeout(300)
}

// ── 기본 렌더링 ───────────────────────────────────────────────────
test('페이지 로드 시 터미널 UI가 렌더링된다', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('terminal-portfolio v1.0.0').first()).toBeVisible()
  await expect(page.getByText('Hello, Reviewer.')).toBeVisible()
  await expect(page.getByText('This site IS the demo.')).toBeVisible()
})

test('초기 메시지에 connected as visitor_ 가 표시된다', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/connected as visitor_/)).toBeVisible()
})

// ── 슬래시 명령어 ────────────────────────────────────────────────
test('/about 명령어가 이름과 역할을 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/about')
  await expect(page.getByText(/장민석/).first()).toBeVisible()
  await expect(page.getByText('Backend Engineer').first()).toBeVisible()
})

test('/projects 명령어가 프로젝트 목록을 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/projects')
  await expect(page.getByText(/Zendesk/).first()).toBeVisible()
  await expect(page.getByText(/ShedLock/).first()).toBeVisible()
})

test('/project <slug> 명령어가 메트릭 테이블을 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/project zendesk-websocket')
  await expect(page.getByText('latency p95')).toBeVisible()
  await expect(page.getByText('120 ms')).toBeVisible()
})

test('/stack 명령어가 기술 스택을 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/stack')
  await expect(page.getByText(/Spring Boot/).first()).toBeVisible()
})

test('/contact 명령어가 이메일을 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/contact')
  await expect(page.getByText(/msjang\.dev@gmail\.com/)).toBeVisible()
})

test('/whoami 명령어가 닉네임을 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/whoami')
  await expect(page.getByText(/nickname/)).toBeVisible()
  await expect(page.getByText(/visitor_/).first()).toBeVisible()
})

test('/help 명령어가 사용 가능한 명령어 목록을 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/help')
  await expect(page.getByText('/about').first()).toBeVisible()
  await expect(page.getByText('/metrics').first()).toBeVisible()
})

test('/wave 명령어가 wave 메시지를 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/wave')
  await expect(page.getByText(/waves!/).first()).toBeVisible()
})

test('/clear 명령어가 터미널을 초기화한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/about')
  await runCmd(page, '/clear')
  // LeftPanel always shows 장민석 — check absence of the about-output-specific text
  await expect(page.getByText('name    : 장민석 (Jang Min-seok)')).not.toBeVisible()
  await expect(page.getByText('terminal-portfolio v1.0.0').first()).toBeVisible()
})

test('알 수 없는 명령어에 에러 메시지를 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/unknown-command')
  await expect(page.getByText(/unknown command/)).toBeVisible()
})

// ── SSE 메트릭 스트리밍 ──────────────────────────────────────────
test('/metrics 명령어가 서버 메트릭 바 차트를 표시한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/metrics')
  // 초기 placeholder 또는 실제 데이터 대기
  await expect(
    page.getByText('SERVER METRICS').or(page.getByText('connecting to metrics stream'))
  ).toBeVisible({ timeout: 5000 })
})

test('/metrics 가 백엔드 연결 시 실시간 데이터를 표시한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/metrics')
  // SSE 스트림에서 첫 번째 이벤트 수신 대기
  await expect(page.getByText('SERVER METRICS')).toBeVisible({ timeout: 5000 })
  // heap/cpu/req/up 행이 모두 표시되는지 확인
  await expect(page.getByText(/heap/).first()).toBeVisible()
  await expect(page.getByText(/cpu/).first()).toBeVisible()
  await expect(page.getByText(/req/).first()).toBeVisible()
  await expect(page.getByText(/up/).first()).toBeVisible()
})

// ── WebSocket Presence ────────────────────────────────────────
test('LeftPanel에 WebSocket 연결 상태가 표시된다', async ({ page }) => {
  await page.goto('/')
  // 백엔드가 실행 중이면 LIVE, 아니면 RETRYING
  await expect(
    page.getByText(/\[LIVE\]/).or(page.getByText('[RETRYING]')).first()
  ).toBeVisible({ timeout: 5000 })
})

test('백엔드 연결 시 [LIVE] N online 이 표시된다', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/\[LIVE\].*online/)).toBeVisible({ timeout: 8000 })
})

test('/live 명령어가 방문자 목록을 출력한다', async ({ page }) => {
  await page.goto('/')
  // WebSocket 연결 대기
  await expect(page.getByText(/\[LIVE\].*online/)).toBeVisible({ timeout: 8000 })
  await runCmd(page, '/live')
  await expect(page.getByText(/visitors currently online/)).toBeVisible()
})

// ── WebSocket 멀티 탭 Activity Feed ──────────────────────────
test('두 번째 탭의 명령어가 첫 번째 탭 activity feed에 나타난다', async ({ browser }) => {
  const ctx1 = await browser.newContext()
  const ctx2 = await browser.newContext()
  const page1 = await ctx1.newPage()
  const page2 = await ctx2.newPage()

  await page1.goto('/')
  await page2.goto('/')

  // 두 탭 모두 WebSocket 연결 대기
  await expect(page1.getByText(/\[LIVE\].*online/)).toBeVisible({ timeout: 8000 })
  await expect(page2.getByText(/\[LIVE\].*online/)).toBeVisible({ timeout: 8000 })

  // 탭2에서 명령어 입력
  await runCmd(page2, '/stack')

  // 탭1의 activity feed에 표시될 때까지 대기 (/stack is less likely to pre-exist in DOM)
  await expect(page1.getByText('/stack').last()).toBeVisible({ timeout: 5000 })

  await ctx1.close()
  await ctx2.close()
})

// ── sudo easter egg ───────────────────────────────────────────
test('/sudo hire-me 가 letter를 출력한다', async ({ page }) => {
  await page.goto('/')
  await runCmd(page, '/sudo hire-me')
  await page.waitForTimeout(1500)
  await expect(page.getByText(/Authentication successful/)).toBeVisible()
  await expect(page.getByText(/YAPP/).first()).toBeVisible()
})

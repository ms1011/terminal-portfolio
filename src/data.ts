import type { Project, SlashCmd } from './types'

export const PROJECTS: Project[] = [
  {
    id: 'PRJ-01',
    slug: 'zendesk-websocket',
    title: 'Zendesk Rate Limit → WebSocket 전환',
    problem: 'Zendesk API rate-limit으로 실시간 대시보드 지연 평균 8s',
    solution: 'Polling → WebSocket 양방향 전환 + Redis Stream 백프레셔',
    result: '지연 8s → 120ms, API 호출 92% 감소',
    period: '2023.02~07',
    stack: ['Java', 'Spring Boot', 'WebSocket', 'Redis'],
    metrics: [
      ['latency p95', '8.4 s', '120 ms'],
      ['api calls/day', '420,000', '33,600'],
      ['error rate', '2.1 %', '0.04 %'],
    ],
  },
  {
    id: 'PRJ-02',
    slug: 'redis-shedlock',
    title: 'Redis + ShedLock 분산 락',
    problem: '배치 다중 인스턴스 중복 실행',
    solution: 'Redis + ShedLock 기반 분산 락 도입',
    result: '중복 0건, 스케줄 SLA 99.9% 달성',
    period: '2023.08~10',
    stack: ['Java', 'Spring Batch', 'Redis', 'ShedLock'],
    metrics: [
      ['duplicate runs', '~12/day', '0'],
      ['schedule SLA', '94.2%', '99.9%'],
      ['lock acquire', 'N/A', '< 5ms'],
    ],
  },
  {
    id: 'PRJ-03',
    slug: 'ai-harness',
    title: 'AI 생산성 시스템',
    problem: '개인 지식 파편화 + 반복작업 과부하',
    solution: 'Obsidian + Claude Code 오케스트레이션',
    result: '주간 산출물 3.4×, 반복작업 주 6h 절감',
    period: '2024.12~',
    stack: ['Obsidian', 'Claude Code', 'Markdown', 'Python'],
    metrics: [
      ['weekly docs', '1x', '3.4x'],
      ['repetitive tasks', '6h/week', '~0h'],
      ['retrieval', 'manual', 'AI-assisted'],
    ],
  },
]

export const STACK_LINES = [
  '[Language]   Java ★★★  ·  Kotlin ★★  ·  TypeScript ★',
  '[Framework]  Spring Boot ★★★  ·  Spring Batch ★★  ·  JPA ★★★',
  '[Data]       MySQL ★★★  ·  Redis ★★★  ·  PostgreSQL ★★  ·  ES ★',
  '[Infra]      Docker ★★  ·  AWS(EC2/S3/RDS) ★★  ·  Jenkins ★★',
  '[Collab]     Git ★★★  ·  Jira/Confluence ★★★  ·  Obsidian ★★',
  '',
  'legend:  ★★★ fluent   ★★ production-ready   ★ learning',
]

export const SLASH_CMDS: SlashCmd[] = [
  { cmd: '/about',    desc: '자기소개 보기' },
  { cmd: '/projects', desc: '프로젝트 목록' },
  { cmd: '/stack',    desc: '기술 스택' },
  { cmd: '/yapp',     desc: 'YAPP 지원 메시지' },
  { cmd: '/contact',  desc: '연락처' },
  { cmd: '/live',     desc: '실시간 방문자 현황' },
  { cmd: '/whoami',   desc: '내 닉네임 확인' },
  { cmd: '/wave',     desc: '모두에게 인사 👋' },
  { cmd: '/help',     desc: '전체 명령어 목록' },
  { cmd: '/clear',    desc: '채팅 초기화' },
]

export const BIRD_ART = `             .-=-.            .:::
             +. .=           .-. .=
             :-.:+==========-==. +.
            -+:..             ..-*.
         .=-.                     .=-.
        :-.                         .+.
        +.      .:.   .:.     .      .-.
       .:       @@* :+...=- :@@:      -:
       :.       ..  :=: .-=  --.      .-
       .*                             =:
      .-+-                           .-.
     :=   --                        .*.
     :=    :=-.                  .-+.
      =-..    -*+**************+*. .+.
        .:---=-.                :-   --
             *.                  #.   -.
             +.                  ++. .-.
             :=.               .--.=*:
              .=-.           :=-.
                .-:++*+++*+-.=.
                :-  .+  .+.  -.
                 -++-     :++-`

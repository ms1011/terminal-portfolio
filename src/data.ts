import type { Project, SlashCmd } from './types'

export const PROJECTS: Project[] = [
  {
    id: 'PRJ-01',
    slug: 'gsc-websocket',
    title: 'GSC 차세대 CS/AS — Rate Limit → WebSocket 전환',
    problem: 'Zendesk Notify API 분당 100회 제한으로 수십 명 상담사 동시 접속 시 즉각 병목 발생',
    solution: 'WebSocket 양방향 통신망 자체 구축, 핵심 커스텀 앱(업무지원·고객정보·카드등록) 전면 리팩토링',
    result: 'Rate Limit 병목 원천 차단, 다중 접속 환경 실시간 응답 확보 · PL 발탁 · 연봉 20% 인상',
    period: '2025.06~2026.01',
    stack: ['Java', 'Spring Boot', 'WebSocket', 'Redis', 'Zendesk'],
    metrics: [
      ['notify api calls', '100/min (hard limit)', '무제한'],
      ['상담사 동시 접속', '병목 발생', '지연 없음'],
      ['아키텍처', 'Polling', 'WebSocket 양방향'],
    ],
  },
  {
    id: 'PRJ-02',
    slug: 'gsc-shedlock',
    title: 'GSC — 분산 환경 배치 동시성 제어',
    problem: 'ALB 기반 다중 인스턴스(Scale-out) 환경에서 배치 중복 실행으로 데이터 충돌·손실 발생',
    solution: 'Redis + ShedLock 분산 락 도입, 단일 노드 실행 보장 + 잔여 데이터 정제 및 예외 처리 강화',
    result: '배치 중복 실행 100% 차단, 데이터 정합성 0% 손실, N대 Scale-out에도 안정적 확장성 확보',
    period: '2025.06~2026.01',
    stack: ['Java', 'Spring Boot', 'Redis', 'ShedLock', 'AWS ALB'],
    metrics: [
      ['duplicate runs', '다수 발생', '0'],
      ['data integrity', '충돌 발생', '100% 보장'],
      ['schedule SLA', '불안정', '99.9%+'],
    ],
  },
  {
    id: 'PRJ-03',
    slug: 'ts-bms',
    title: 'TS교통안전관리공단 학사관리 시스템 (FO/BO)',
    problem: '사내 최초 REST API 도입 + 기획 부재 속 2주 MVP 런칭 + 전임자 이탈로 FO/BO 단독 전담',
    solution: 'God Object DTO → Request/Response 분리 리팩토링, 도메인 DB 재설계(과정·센터·회차), 결제 상태 Decoupling',
    result: '2주 MVP 런칭 100% 준수, PG(나이스페이) · 출결 고도화 무장애 확장, 사내 REST API 가이드라인 정립',
    period: '2025.01~04',
    stack: ['Java', 'Spring Boot', 'MariaDB', 'NicePay PG'],
    metrics: [
      ['mvp launch', '2주 목표', '2주 완수'],
      ['dto params', '50+ (혼재)', 'Request / Response 분리'],
      ['fe 연동 오류', '빈번 발생', '최소화'],
    ],
  },
  {
    id: 'PRJ-04',
    slug: 'ai-agent',
    title: '사내 AI 코딩 에이전트 — LLM 멀티 에이전트 오케스트레이션',
    problem: 'SI 반복 보일러플레이트 · 산출물 작성에 막대한 리소스 소모, 팀 내 AI 지식 부족으로 도입 난항',
    solution: 'Figma MCP 연동 포함 멀티 에이전트 파이프라인(IA·DB·API·BE·FE·QA) 설계 및 PL 수행, 프롬프트 엔지니어링 사내 전파',
    result: '역할별 생성 에이전트 구현(Phase 1) 완수, 사내 AI 자동화 파이프라인 기반 확립',
    period: '2025.~',
    stack: ['Claude', 'LLM', 'Spring Boot', 'Figma MCP', 'Prompt Engineering'],
    metrics: [
      ['agent types', '0', '6 (IA/DB/API/BE/FE/QA)'],
      ['boilerplate', '수동 작성', 'AI 자동 생성'],
      ['팀 AI 도입', '0%', 'Phase 1 완수'],
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

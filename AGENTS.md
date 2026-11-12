# AGENTS.md — 작업 규약 (정본)

사람과 AI 에이전트가 함께 따르는 유일한 규약이다. `CLAUDE.md`는 이 파일을 불러오기만 한다. **8KB 이하**(`wc -c AGENTS.md`, 한글 1자 3바이트). 결정은 `docs/DECISIONS.md`, 변하는 값은 `docs/STATUS.md`에만 둔다.

## 0. 절대 규칙
1. **검증 없이 완료라고 말하지 않는다.** 명령을 실제로 돌리고 출력과 exit 코드를 읽은 뒤 보고한다. "아마", "될 것"은 미검증이다.
2. **결과를 지어내지 않는다.** 리뷰·테스트·검수 결과는 확인한 것만 인용한다.
3. **비밀값에 손대지 않는다.** 저장소는 **공개**다. `.env*`·키 파일을 읽거나 출력하거나 커밋하지 않는다.
4. **사용자가 할 일은 붙여넣기 가능한 완성 명령으로** 준다. 에이전트가 할 수 있는 일은 넘기지 않는다.
5. **문서와 코드가 다르면 코드가 맞다.** 문서를 고치고 보고한다.
6. **같은 실수를 두 번 하면 규칙을 더한다.** 가능하면 검사·훅으로, 아니면 이 파일에 한 줄 + 근거(`D-n`).
7. **훅이 막으면 우회하지 않는다.** `--no-verify`, 훅 삭제·이동, 환경변수 조작 금지.
8. 대화·문서는 쉬운 한국어, 코드 식별자·커밋 type은 영어. 사용자는 비개발자다. 보고는 된 것 / 안 된 것 / 다음 할 일 순서로 짧게.

## 1. 프로젝트 한눈에
쇼츠처럼 스크롤하면 영상 대신 책 카드가 나오는 한국어 PWA. 첫 사용자는 만든 사람 본인(안드로이드). 지금은 **0단계(최소 버전) 개발 전**. 순수 HTML/CSS/JS(빌드 없음), GitHub Pages 배포. 기획은 `docs/PRD.md`(로컬 전용), 구조는 `docs/ARCHITECTURE.md`.

| 위치 | 역할 | 명령 |
|---|---|---|
| `index.html`, `app/` | 화면 코드(PWA) | VS Code Live Server "Go Live" |
| `content/` | 책 카드 JSON(앱이 읽음) | — |
| `pipeline/` | 원문·검수 기록(앱이 안 읽음) | — |
| `docs/` | 기획·구조·현황·결정·할 일·일지 | — |

## 2. 문서 지도와 갱신 트리거
| 문서 | 무엇 | 언제 고치나 |
|---|---|---|
| `docs/PRD.md` | 기획 정본. **커밋 금지** | 기획이 바뀔 때 |
| `docs/ARCHITECTURE.md` | 설계 원칙·구조·데이터 형식 | 구조 변경 |
| `docs/card-guide.md` | 카드 제작 기준(모든 AI 공통) | 카드 형식 변경 |
| `docs/STATUS.md` | 지금 상태(덮어쓰기, 6KB 이하) | `/wrap` |
| `docs/buildlog/YYYY-MM.md` | 작업 일지(5단, 최신이 위) | `/wrap` |
| `docs/TASKS.md` | 할 일 `#n` | 작업 시작·종료 |
| `docs/DECISIONS.md` | 결정 `D-n`(행 300자 이내) | 결정 직후 |
| `docs/HANDOFF.md`·`SETUP.md` | 인수인계·새 컴퓨터 | 넘기기 전 |

같은 내용을 두 곳에 쓰지 않는다. 한 곳에 쓰고 가리킨다.

## 3. 새 세션 시작
`/onboard`: `docs/STATUS.md` §1 → `docs/TASKS.md`에서 `#n`을 잡아 `## 진행중`에. 끝나면 `/wrap`.

## 4. 검증 명령
- 전체 검사: `node scripts/verify.mjs` — 카드 JSON·PWA 파일·§6 규칙. exit 0이면 통과. "건너뜀" 줄은 검사 안 한 것이니 통과로 세지 않는다.
- 검사 도구 시험: `node --test scripts/` (검사 도구를 고쳤을 때)
- 화면 확인: Live Server로 열어 직접 확인 → 확인한 것과 못 한 것을 나눠 보고.
- 가드 자가 시험: `/harness-check`

## 5. 커밋·PR
- `type(scope): 요약 (#n)`. type: feat, fix, test, docs, chore, refactor. 본문에 "확인:"(실행한 명령과 결과).
- 한 커밋에는 한 가지 일. 0단계는 `main`에 직접 커밋한다(혼자 작업).
- 커밋 전 `git status`로 `docs/PRD.md`가 목록에 없는지 확인한다.

## 6. 리뷰 규칙 (Code Review Rules)
`/self-review`·`reviewer` 에이전트의 기준.
- 비밀값·토큰·개인정보가 diff에 0건.
- `docs/PRD.md`가 추적 파일에 0건: `git ls-files docs/PRD.md` 출력 없음.
- 디버깅용 `console.log`·주석 처리한 코드 덩어리 0건.
- 기록 저장은 `app/js/storage.js`만 한다: `grep -rn localStorage app/js | grep -v storage.js` 0건.
- 외부 스크립트·CDN 없이 동작한다(오프라인 PWA). 글꼴·아이콘은 `assets/`에.
- 카드 JSON은 `docs/ARCHITECTURE.md` §4 형식을 따르고 `source.url`·`source.license`가 있다.
- 카드 내용은 원문에 근거가 있다. 생성한 AI와 다른 AI의 검수 기록이 `pipeline/reports/`에 있다(`review.reviewedBy`).
- diff 밖 심볼은 파일을 열어 확인한 뒤에만 지적한다. 취향·이론적 위험은 nit.

## 7. 멈추고 물어볼 것
아래만 **실행 전에 사용자 승인**. 그 밖의 되돌릴 수 있는 일은 묻지 않고 한다.
- **개발 단계 시작**: 새 `#n` 개발 작업(코드 작성)을 시작하기 전 "시작할까요?"로 묻는다. 문서 정리는 묻지 않는다.
- 외부 공개: GitHub 저장소 생성, 첫 push, GitHub Pages 켜기, 저장소 공개 범위 변경
- 새 프로그램·서비스 설치·가입, 돈이 드는 일(유료 API 등)
- 지우기·덮어쓰기처럼 되돌릴 수 없는 일, 강제 푸시·히스토리 재작성
- 민감 경로 수정: `.github/workflows/**`, `.claude/**`, `.gitignore`, `docs/PRD.md`

민감 경로는 `.claude/harness.json`의 `protectedPaths`와 같게 유지한다.

## 8. 대기는 일이 아니다
- 결과에 의존하지 않는 다음 일을 한다. "결과 나오면 하겠습니다"로 끝내지 않는다.
- 사용자 결정 대기는 정당한 정지다. 정할 것, 선택지, 추천을 함께 적는다.

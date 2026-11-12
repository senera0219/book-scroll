# 현황 — 최종 확인: 2026-11-12(목)
> 덮어쓰기 문서. 지금 상태만 6KB 이하로 쓴다(`wc -c docs/STATUS.md`). 지난 일은 `docs/buildlog/`에. `/wrap`이 갱신한다.

## 0. 한 줄
기획·설계·하네스, GitHub 공개 저장소, 카드 제작 가이드 v0.1, 검사 도구(`node scripts/verify.mjs`) 완료. 앱 화면과 카드는 아직 없음.

## 1. 다음 첫 작업
`#5` 화면 + 『명상록』 1권. 코드 작업이라 시작 전 "시작할까요?". 큰 작업이라 `plan-with-files`로 `docs/tasks/T-05.md`부터. 먼저 명상록 판본(번역자 확인되는 것)을 정한다(§3).

## 2. ▶ 사용자 할 일
- 없음. (2026-11-12 새 세션에서 `rm -rf ~/harness-test` 차단 확인 완료)

## 3. 안 되는 것 — 정직하게
- 검사 도구는 지금 카드·화면이 없어 대부분 "건너뜀"이다. 실제로 검사하는 것은 `#5`부터. 화면 동작(스와이프 등)은 검사 도구가 못 보니 직접 확인.
- 안전 가드: 새 세션에서 `rm -rf ~/harness-test` 실제 차단 확인됨(2026-11-12). 전체 자가 시험은 아직 재확인 안 함. 이전 자가 시험(`harness-check`)은 597/636 통과. 실패 38건은 시험 준비 단계에서 git이 `\\.\nul`을 열지 못한 것으로, 이 Claude 세션의 실행 제한(샌드박스) 때문으로 보인다. 나머지 1건: 현재 폴더를 Windows 경로(역슬래시)로 `rm -rf` 하면 차단 대신 "확인 요청"으로 처리된다(위험하지는 않음). 새 세션에서 `/harness-check`로 다시 확인할 것.
- 카드 가이드의 길이 기준·말투는 잠정(시험 제작 뒤 조정, Q-1·Q-2).
- 『명상록』 판본: George Long 영역본(Gutenberg #15877)으로 결정(D-11). 원문 `pipeline/sources/meditations.txt`.

## 4. 어디에 뭐가 있나
| 무엇 | 어디(경로·URL) | 상태 |
|---|---|---|
| 저장소 | https://github.com/senera0219/book-scroll | 공개, `main`. 커밋 이메일은 GitHub noreply(이 저장소만) |
| 규약 | `AGENTS.md` | 유효 |
| 기획 | `docs/PRD.md` | 로컬 전용, 커밋 금지 |
| 설계 | `docs/ARCHITECTURE.md` | 확정 |
| 결정 | `docs/DECISIONS.md` | D-1~D-10, 미결 Q-1~Q-5 |
| 하네스 키트 | `C:\Users\Samuel\.claude-harness-kit` | v0.1.0 설치됨 |
| 온라인 PRD 사본 | claude.ai Docs | 2026-11-12 시점 사본, 갱신 안 함 |

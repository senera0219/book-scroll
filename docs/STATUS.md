# 현황 — 최종 확인: 2026-11-23(월)
> 덮어쓰기 문서. 지금 상태만 6KB 이하로 쓴다(`wc -c docs/STATUS.md`). 지난 일은 `docs/buildlog/`에. `/wrap`이 갱신한다.

## 0. 한 줄
『명상록』 1권으로 앱이 돌아간다(https://senera0219.github.io/book-scroll/, 오프라인 열림 사용자 확인). 컴퓨터 클릭 넘기기·방향키·글자 크기(⚙ 설정 안), 카드마다 원문 위치(`loc`), ☆ 저장 + ★ 저장함(목록/카드 보기 설정), 서점 5곳 검색 링크까지 완료. 서비스 워커 `v10`.

## 1. 다음 첫 작업
`#13` 도서관에서 찾기 준비. 사용자가 도서관 정보나루(data4library.kr) 가입·인증키 신청 → 승인 기다리는 동안 키 없이 할 일(책 데이터에 ISBN 추가, 지역 고르기 화면)부터. 키는 공개 저장소에 둘 수 없어 중간 서버(추천: Cloudflare Workers, Q-3과 같은 곳)가 필요 — 가입은 사용자 승인 뒤. 시작 전에 "시작할까요?" 확인.
로컬 확인: `node scripts/serve.mjs` → http://localhost:5500 , 검사: `node scripts/verify.mjs && node --test scripts/`

## 2. ▶ 사용자 할 일
1. 도서관 정보나루 가입·인증키 신청(Claude가 순서를 안내. 키는 채팅·파일에 붙여넣지 말 것).
2. 밀리의 서재에 로그인한 상태로 해설 카드 → 서점에서 찾기 → 밀리의 서재를 눌러 검색 결과가 나오는지 알려 주기.
3. 휴대폰에서 확인: 앱 열기·홈 화면 설치·★ 저장함 목록에서 책 연 뒤 휴대폰 뒤로 가기가 목록으로 돌아오는지.

## 3. 안 되는 것 — 정직하게
- 실제 휴대폰 확인 안 함(#5·#6·#11·#12). 시험은 헤드리스 Edge(화면 없는 브라우저)로만 함.
- 밀리의 서재 검색 주소(`/v3/search/result/검색어`)는 로그인이 필요해 결과 확인 못 함. 버튼에 "(로그인 필요)" 표시.
- 휴대폰 폭에서 서점 목록을 펼치면 해설 카드 아래(출처·쪽 번호·☆ 저장)가 화면 밖 → 카드 안에서 밀어 올려야 보임.
- 휴대폰 폭에서 탭 7개가 한 줄에 다 안 들어감("과학·기술"·"★ 저장함"은 탭 줄을 옆으로 밀어야 보임).
- 옛 파일이 보이면 Ctrl+Shift+R 한 번(서비스 워커를 network-first로 바꿔 보통은 새로고침 한 번이면 됨).
- 안전 가드 전체 자가 시험(`/harness-check`)은 2026-11-12 이후 재확인 안 함.
- 카드 가이드의 길이 기준·말투는 잠정(Q-1·Q-2).

## 4. 어디에 뭐가 있나
| 무엇 | 어디(경로·URL) | 상태 |
|---|---|---|
| 저장소 | https://github.com/senera0219/book-scroll | 공개, `main` 직접 커밋 |
| 앱 주소 | https://senera0219.github.io/book-scroll/ | `main` 푸시 1분쯤 뒤 갱신. 확인: `sw.js`의 VERSION |
| 규약 | `AGENTS.md` | 유효 |
| 기획 | `docs/PRD.md` | 로컬 전용, 커밋 금지 |
| 설계·데이터 형식 | `docs/ARCHITECTURE.md` | §4 카드(loc·page·storeQuery), §5 저장 키 |
| 결정 | `docs/DECISIONS.md` | D-1~D-13, 미결 Q-1~Q-5 |
| 할 일 | `docs/TASKS.md` | #12까지 진행, 다음 #13 |
| 화면 코드 | `app/js/`(main·render·feed·controls·textsize·bookmarks·settings·stores·storage) | 브라우저 저장은 `storage.js`만 |
| 서점 주소 | `app/js/stores.js` | 주소 모양 바뀌면 여기만 고침 |
| 카드 | `content/books/meditations.json` | 5장+해설 |
| 하네스 키트 | `C:\Users\Samuel\.claude-harness-kit` | v0.1.0 |

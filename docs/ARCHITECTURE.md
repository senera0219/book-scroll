# 아키텍처 (0단계)

- 최종 수정: 2026-11-12
- 기준 문서: `docs/PRD.md` (Q1~Q23)
- 상태: 확정 (Q24). 알림 서버 선택만 0단계 마지막에 결정한다.

---

## 0. 설계 원칙 — 깨면 안 되는 것

리뷰가 이 절을 기준으로 본다. 근거는 `docs/DECISIONS.md`.

1. 서버 없이 동작한다. 알림 서버를 빼면 GitHub Pages 정적 파일만으로 돌아간다 (D-5).
2. 기록 저장은 `storage.js` 한 곳에서만 한다 (D-6).
3. 외부 CDN·스크립트 없이 오프라인에서 열린다.
4. 카드는 원문 근거와 출처(`source`)가 있고, 다른 AI의 검수 기록이 있다 (D-4).
5. 비밀값은 저장소에 없다. `docs/PRD.md`도 저장소에 없다 (D-7, D-9).

## 1. 한눈에 보기

0단계는 **서버 없는 정적 웹앱**이다. 카드는 미리 만들어 JSON 파일로 저장하고, 기록은 휴대폰 브라우저 안에 저장한다. 서버가 필요한 것은 알림 하나뿐이며, 0단계 마지막에 따로 붙인다.

```
 ┌───────────── 내 컴퓨터 (만드는 곳) ─────────────┐
 │                                                 │
 │  원문(퍼블릭 도메인)                            │
 │      │  Claude Code: 번역 → 카드 생성 → 검수     │
 │      ▼   (기준: docs/card-guide.md)             │
 │  content/books/*.json  +  app/ (화면 코드)      │
 │      │                                          │
 └──────┼──────────────────────────────────────────┘
        │ git push
        ▼
 ┌──── GitHub (공개 저장소) ────┐
 │  GitHub Pages: https 주소로  │
 │  app + content 를 그대로 제공 │
 └──────┬───────────────────────┘
        │ 처음 열 때 다운로드 + 홈 화면 설치
        ▼
 ┌──────────── 안드로이드 휴대폰 (PWA) ────────────┐
 │  화면: 탭 · 세로 피드 · 가로 카드 · 해설 카드   │
 │  서비스 워커: 앱과 카드를 저장 → 오프라인 동작  │
 │  브라우저 저장소: 읽은 기록 · 스트릭 · 설정     │
 └──────▲──────────────────────────────────────────┘
        │ 하루 한 번 "오늘의 문장" (0단계 마지막)
 ┌──────┴──────────────────────┐
 │  알림 서버 (무료 서비스)     │
 │  비밀 키는 여기에만 보관      │
 └─────────────────────────────┘
```

## 2. 기술 선택

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 화면 코드 | **순수 HTML + CSS + JavaScript** (빌드 도구 없음) | Node.js 설치가 필요 없고, 파일을 그대로 GitHub Pages에 올리면 끝난다. 구조가 단순해서 AI가 고치기 쉽다 |
| 스와이프 | **CSS 스크롤 스냅** | 세로·가로 넘김을 브라우저 기본 기능으로 처리해 부드럽고 코드가 적다 |
| 오프라인 | **서비스 워커** | PWA의 표준 방식. 앱 화면과 카드, 글꼴을 휴대폰에 저장한다 |
| 기록 저장 | **localStorage** (저장 모듈로 감쌈) | 로그인 없이 바로 동작. 2단계에서 서버 저장으로 바꿀 때 저장 모듈만 교체한다 |
| 카드 데이터 | **책마다 JSON 파일 1개** | 사람과 AI가 모두 읽고 고치기 쉽다. 데이터베이스가 필요 없다 |
| 글꼴 | **Noto Serif KR**(본문 명조), Pretendard(메뉴) | 무료 글꼴. 서비스 워커로 저장해 오프라인에서도 같은 화면 |
| 배포 | **GitHub Pages** | 무료, https 제공, 저장소에 올리면 자동 배포 |
| 알림 | **Web Push + 무료 서버리스 서비스** (예: Cloudflare Workers) | 알림을 보내려면 비밀 키를 가진 서버가 필요하다. 공개 저장소에 비밀 키를 둘 수 없어서 분리한다 |
| 로컬 테스트 | VS Code + Live Server 확장 (설치 완료, v5.7.10) | 이미 설치된 VS Code로 내 컴퓨터에서 미리 보기 |

## 3. 폴더 구조

```
book-scroll/
├─ index.html              # 앱의 시작 화면 (GitHub Pages가 여는 파일)
├─ manifest.webmanifest    # PWA 정보: 이름, 아이콘, 전체 화면
├─ sw.js                   # 서비스 워커: 오프라인 저장, 미리 불러오기
├─ app/
│  ├─ styles/
│  │  ├─ base.css          # 종이책 테마, 글꼴, 색상 변수
│  │  └─ feed.css          # 탭, 세로 피드, 가로 카드, 해설 카드
│  └─ js/
│     ├─ main.js           # 시작점: 각 모듈을 연결
│     ├─ content.js        # 카드 데이터 불러오기
│     ├─ feed.js           # 전체 탭 순서 정하기 (주제 번갈아 + 안 읽은 책 먼저)
│     ├─ render.js         # 카드와 해설 카드 그리기
│     ├─ tracker.js        # 읽음 기록, 오늘 카드 수, 스트릭
│     ├─ settings.js       # 글자 크기, 테마
│     └─ storage.js        # 저장소 창구 (localStorage, 2단계에서 교체)
├─ content/
│  ├─ index.json           # 책 목록: id, 제목, 탭, 파일 위치
│  └─ books/
│     ├─ meditations.json
│     └─ ...
├─ pipeline/               # 카드를 만드는 재료 (앱에는 쓰이지 않음)
│  ├─ sources/             # 원문 텍스트 (퍼블릭 도메인)
│  └─ reports/             # 검수 기록
├─ assets/                 # 아이콘, 글꼴
├─ docs/
│  ├─ card-guide.md        # 카드 제작 가이드 (공개)
│  ├─ ARCHITECTURE.md      # 이 문서 (공개)
│  └─ PRD.md               # 기획 문서 (.gitignore로 제외, 컴퓨터에만)
└─ .gitignore
```

## 4. 카드 데이터 형식

책 한 권 = JSON 파일 하나. 형식이 고정되어 있어야 Claude와 ChatGPT가 만든 카드를 같은 화면에 띄울 수 있다.

```json
{
  "id": "meditations",
  "lang": "ko",
  "title": "명상록",
  "author": "마르쿠스 아우렐리우스",
  "tab": "philosophy",
  "source": {
    "originalLang": "grc",
    "translatedFrom": "en",
    "edition": "George Long 영역본 (1862)",
    "url": "https://www.gutenberg.org/ebooks/...",
    "license": "public-domain"
  },
  "unit": "bundle",
  "cards": [
    {
      "id": "meditations-01",
      "type": "quote",
      "text": "본문 (번역문)",
      "note": "2~3줄 해설 (type이 quote일 때)"
    }
  ],
  "commentary": {
    "about": "이 책은 어떤 책인가",
    "today": "그리고 지금은 (오늘과의 연결)",
    "related": ["seneca-shortness-of-life"],
    "links": { "buy": "구매 검색 링크", "library": "도서관 검색 링크" }
  },
  "dailyQuote": "알림에 쓸 한 줄",
  "review": { "generatedBy": "claude", "reviewedBy": "chatgpt", "date": "2026-11-12" }
}
```

- `type`: `excerpt`(원문 발췌) · `summary`(요약·재구성) · `quote`(한 문장 + 해설) · `original`(퍼블릭 도메인 원문)
- `tab`: `literature` · `self-help` · `philosophy` · `society` · `science`
- `unit`: `bundle`(짧은 묶음) 또는 `chapter`(챕터). 형식과 범위는 시험 제작 뒤에 정한다.
- `lang`: 다국어 확장을 위해 처음부터 둔다.

책 목록 `content/index.json`:

```json
{ "books": [ { "id": "meditations", "title": "명상록", "tab": "philosophy", "file": "books/meditations.json" } ] }
```

- `id`·`title`·`tab`은 책 파일과 같아야 하고, `file`은 `books/<id>.json`.
- 이 절의 형식과 `docs/card-guide.md`의 규칙은 `node scripts/verify.mjs`가 검사한다.

## 5. 기록 데이터 (휴대폰 안)

```json
{
  "readCards": { "meditations-01": "2026-11-12" },
  "daily": { "2026-11-12": { "cards": 42, "books": ["meditations", "candle"] } },
  "streak": { "current": 12, "lastDay": "2026-11-12" },
  "settings": { "fontSize": "medium", "theme": "paper", "notifyAt": "23:00" }
}
```

- 모든 읽기와 쓰기는 `storage.js`를 거친다. 다른 파일은 localStorage를 직접 만지지 않는다.
- 브라우저 데이터를 지우면 사라진다(0단계에서 감수). 백업용 "기록 내보내기" 버튼은 1단계 후보.

## 6. 주요 흐름

**앱을 열 때**
1. 서비스 워커가 저장된 화면을 즉시 띄운다 (오프라인이어도 열림).
2. `content/index.json`으로 책 목록을 읽는다.
3. `feed.js`가 순서를 정한다: 안 읽은 책을 먼저, 주제가 겹치지 않게 번갈아.
4. 첫 책과 다음 2~3권의 카드를 미리 받아 둔다 (지하철 대비).

**카드를 볼 때**
1. 카드가 화면에 절반 이상 보이면 읽음으로 기록한다.
2. 오늘 카드 수와 스트릭을 갱신한다.
3. 세로로 넘기면 다음 책, 가로로 넘기면 같은 책의 다음 카드, 마지막은 해설 카드.

**카드를 만들 때 (내 컴퓨터)**
1. 원문을 `pipeline/sources/`에 저장한다.
2. Claude Code가 `card-guide.md`에 따라 번역, 카드 생성.
3. 다른 AI(ChatGPT 등)가 원문과 대조 검수 → `pipeline/reports/`에 기록.
4. 통과한 결과를 `content/books/*.json`으로 저장하고 `index.json`에 추가.

## 7. 보안과 공개 범위

- 저장소는 공개다. **비밀 키, 개인 정보는 절대 넣지 않는다.**
- 알림용 비밀 키(VAPID 개인 키)는 알림 서버의 설정에만 보관한다.
- `docs/PRD.md`는 `.gitignore`로 제외한다.

## 8. 2단계를 위한 여지

| 나중에 필요한 것 | 지금 해 두는 준비 |
| --- | --- |
| 로그인, 서버 저장 | 저장을 `storage.js` 한 곳으로 모음 |
| 다국어 | 카드에 `lang` 항목 |
| 사용자 투고, 댓글 | 카드마다 고유 `id` |
| 앱스토어 출시 | PWA 표준을 지킴 (나중에 앱으로 감싸기 쉬움) |
| 책 수백 권 | 책마다 파일을 나누고 목록은 `index.json` 하나로 관리 |

## 9. 결정할 것

- [x] 화면 코드 방식: **순수 HTML/CSS/JS**. 기능이 많아져 프레임워크가 필요해지면 그때 옮긴다 (카드 JSON은 그대로 재사용).
- [x] 공개 범위: `docs/ARCHITECTURE.md`, `docs/card-guide.md`는 공개 저장소에 올린다. `docs/PRD.md`만 제외한다.
- [ ] 알림 서버 서비스 선택 (0단계 마지막에 결정)

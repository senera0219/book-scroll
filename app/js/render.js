// 화면 그리기: 책 한 권 = 세로 한 칸, 그 안에 가로 카드들 + 마지막 해설 카드.
// 내용은 모두 textContent로 넣는다(카드 글이 HTML로 해석되지 않게).
import { isSaved } from './bookmarks.js';
import { storeLinks } from './stores.js';

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c) node.append(c);
  return node;
}

function head(book) {
  return el('div', { class: 'card-head' },
    el('span', { class: 'title', text: `『${book.title}』` }),
    el('span', { class: 'author', text: book.author }));
}

export function setSaveButton(btn, saved) {
  btn.setAttribute('aria-pressed', String(saved));
  btn.setAttribute('aria-label', saved ? '저장 취소' : '이 카드 저장');
  btn.textContent = saved ? '★ 저장됨' : '☆ 저장';
}

export function saveButton(bookId, cardId) {
  const btn = el('button', { class: 'save', type: 'button', 'data-book-id': bookId, 'data-card-id': cardId });
  setSaveButton(btn, isSaved(cardId));
  return btn;
}

function foot(book, cardId, pageLabel, showHint) {
  return el('div', { class: 'card-foot' },
    el('span', { class: 'page', text: pageLabel }),
    showHint ? el('span', { class: 'hint' },
      el('span', { class: 'hint-touch', text: '옆으로 넘기기 →' }),
      el('span', { class: 'hint-mouse', text: '오른쪽을 누르면 다음 장 →' })) : null,
    saveButton(book.id, cardId));
}

// 원문 위치: 판본과 상관없는 위치(예: 2권 1절) + 출판사가 확실한 판본이면 쪽수.
function locText(book, card) {
  if (!card.loc) return '';
  const page = card.page && book.source.publisher ? ` · ${book.source.publisher} ${card.page}쪽` : '';
  return `— ${card.loc}${page}`;
}

function cardView(book, card, pageLabel, showHint) {
  const loc = locText(book, card);
  return el('article', { class: 'card', 'data-type': card.type, 'data-card-id': card.id },
    head(book),
    el('div', { class: 'card-body' },
      el('p', { class: 'card-text', text: card.text }),
      loc ? el('p', { class: 'card-loc', text: loc }) : null,
      card.note ? el('p', { class: 'card-note', text: card.note }) : null),
    foot(book, card.id, pageLabel, showHint));
}

// 서점에서 찾기: 누르면 아래에 서점 목록이 펼쳐진다.
function storesBlock(book, link, libraryUrl) {
  const list = el('div', { class: 'store-list', hidden: '' },
    ...storeLinks(book).map((s) => {
      const a = link(s.url, s.name);
      if (s.note) a.append(el('small', { text: ` (${s.note})` }));
      return a;
    }));
  const toggle = el('button', { type: 'button', class: 'store-toggle', 'aria-expanded': 'false', text: '서점에서 찾기 ▾' });
  toggle.addEventListener('click', () => {
    const open = list.hidden;
    list.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '서점에서 찾기 ▴' : '서점에서 찾기 ▾';
  });
  return el('div', { class: 'links-wrap' },
    el('div', { class: 'links' }, toggle, link(libraryUrl, '도서관에서 찾기')),
    list);
}

function commentaryView(book, pageLabel) {
  const c = book.commentary;
  const link = (href, label) => el('a', { href, target: '_blank', rel: 'noopener', text: label });
  return el('article', { class: 'card commentary', 'data-type': 'commentary' },
    head(book),
    el('div', { class: 'card-body' },
      el('h2', { text: '이 책은' }),
      el('p', { text: c.about }),
      el('h2', { text: '그리고 지금은' }),
      el('p', { text: c.today }),
      storesBlock(book, link, c.links.library),
      el('p', { class: 'source' },
        document.createTextNode(`원문: ${book.source.edition} · `),
        link(book.source.url, '출처'))),
    foot(book, `${book.id}-commentary`, pageLabel, false));
}

export function bookView(book, isFirst) {
  const total = book.cards.length + 1;
  const row = el('div', { class: 'cards' });
  book.cards.forEach((card, i) => {
    row.append(cardView(book, card, `${i + 1} / ${total}`, isFirst && i === 0));
  });
  row.append(commentaryView(book, `${total} / ${total}`));
  return el('section', { class: 'book', 'data-book-id': book.id, 'aria-label': book.title }, row);
}

// 저장함: 저장한 카드 한 장 = 세로 한 칸. 위아래로 넘겨 본다.
export function savedView(items) {
  return items.map(({ book, card }, i) => {
    const label = `저장함 ${i + 1} / ${items.length}`;
    const view = card ? cardView(book, card, label, false) : commentaryView(book, label);
    return el('section', { class: 'book', 'data-book-id': book.id, 'aria-label': book.title },
      el('div', { class: 'cards' }, view));
  });
}

// 저장함 목록 보기: 책마다 한 줄(제목·저자·저장한 위치). 누르면 그 책을 카드 화면으로 연다.
export function savedListView(items, onOpen) {
  const groups = new Map(); // 최근에 저장한 책이 위로
  for (const { book, card } of items) {
    if (!groups.has(book.id)) groups.set(book.id, { book, places: [] });
    groups.get(book.id).places.push(card ? (card.loc || '구절') : '해설');
  }
  const rows = [...groups.values()].map(({ book, places }) => {
    const row = el('button', { class: 'saved-row', type: 'button', 'data-book-id': book.id },
      el('span', { class: 'title', text: `『${book.title}』` }),
      el('span', { class: 'author', text: book.author }),
      el('span', { class: 'where', text: `저장 ${places.length}곳 · ${places.join(', ')}` }));
    row.addEventListener('click', () => onOpen(book.id));
    return row;
  });
  return el('div', { class: 'saved-list' },
    el('h2', { text: `저장한 책 ${groups.size}권` }), ...rows);
}

// 목록에서 연 책: 평소 카드 화면 + 왼쪽 위 '저장함 목록' 버튼.
export function openedBookView(book, onBack) {
  const back = el('button', { class: 'back', type: 'button', text: '← 저장함 목록' });
  back.addEventListener('click', onBack);
  return [bookView(book, false), back];
}

export function tabsView(tabs, current, onSelect) {
  return tabs.map((t) => {
    const b = el('button', {
      class: 'tab', role: 'tab', type: 'button',
      'aria-selected': String(t.id === current), text: t.label,
    });
    b.addEventListener('click', () => onSelect(t.id));
    return b;
  });
}

export function messageView(text) {
  return el('p', { class: 'feed-message', text });
}

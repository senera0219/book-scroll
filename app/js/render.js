// 화면 그리기: 책 한 권 = 세로 한 칸, 그 안에 가로 카드들 + 마지막 해설 카드.
// 내용은 모두 textContent로 넣는다(카드 글이 HTML로 해석되지 않게).

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
    el('span', { text: ` ${book.author}` }));
}

function foot(page, total, showHint) {
  return el('div', { class: 'card-foot' },
    el('span', { text: `${page} / ${total}` }),
    showHint ? el('span', { class: 'hint', text: '옆으로 넘기기 →' }) : null);
}

function cardView(book, card, page, total, showHint) {
  return el('article', { class: 'card', 'data-type': card.type, 'data-card-id': card.id },
    head(book),
    el('div', { class: 'card-body' },
      el('p', { class: 'card-text', text: card.text }),
      card.note ? el('p', { class: 'card-note', text: card.note }) : null),
    foot(page, total, showHint));
}

function commentaryView(book, page, total) {
  const c = book.commentary;
  const link = (href, label) => el('a', { href, target: '_blank', rel: 'noopener', text: label });
  return el('article', { class: 'card commentary', 'data-type': 'commentary' },
    head(book),
    el('div', { class: 'card-body' },
      el('h2', { text: '이 책은' }),
      el('p', { text: c.about }),
      el('h2', { text: '그리고 지금은' }),
      el('p', { text: c.today }),
      el('div', { class: 'links' },
        link(c.links.buy, '서점에서 찾기'),
        link(c.links.library, '도서관에서 찾기')),
      el('p', { class: 'source' },
        document.createTextNode(`원문: ${book.source.edition} · `),
        link(book.source.url, '출처'))),
    foot(page, total, false));
}

export function bookView(book, isFirst) {
  const total = book.cards.length + 1;
  const row = el('div', { class: 'cards' });
  book.cards.forEach((card, i) => {
    row.append(cardView(book, card, i + 1, total, isFirst && i === 0));
  });
  row.append(commentaryView(book, total, total));
  return el('section', { class: 'book', 'data-book-id': book.id, 'aria-label': book.title }, row);
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

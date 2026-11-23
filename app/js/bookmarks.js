// 저장하기(북마크): 카드 id 목록을 기기에 기억한다. 해설 카드는 "<책id>-commentary".
import * as storage from './storage.js';

function all() {
  const list = storage.get('saved', []);
  return Array.isArray(list) ? list : [];
}

export function isSaved(cardId) {
  return all().some((s) => s.card === cardId);
}

// 저장돼 있으면 빼고, 없으면 맨 앞(최신)에 넣는다. 바뀐 뒤 저장 상태를 돌려준다.
export function toggle(bookId, cardId) {
  const list = all();
  const i = list.findIndex((s) => s.card === cardId);
  if (i >= 0) list.splice(i, 1);
  else list.unshift({ book: bookId, card: cardId, at: new Date().toISOString().slice(0, 10) });
  storage.set('saved', list);
  return i < 0;
}

// 저장한 순서(최신 먼저)대로 [{ book, card }]. 책·카드가 사라졌으면 건너뛴다.
export function savedItems(books) {
  const byId = new Map(books.map((b) => [b.id, b]));
  const out = [];
  for (const s of all()) {
    const book = byId.get(s.book);
    if (!book) continue;
    if (s.card === `${book.id}-commentary`) out.push({ book, card: null });
    else {
      const card = book.cards.find((c) => c.id === s.card);
      if (card) out.push({ book, card });
    }
  }
  return out;
}

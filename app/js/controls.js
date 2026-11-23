// 컴퓨터 조작: 마우스 클릭(이북리더 방식)과 방향키로 넘기기.
// 카드 오른쪽 절반 클릭 = 다음 장, 왼쪽 절반 = 이전 장. 휠·↑↓ = 다른 책.
// 휴대폰 터치는 기존처럼 손가락으로 넘긴다(톡 건드려 넘어가는 실수를 막으려고 마우스만 받는다).

function smooth() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function currentBook(feedEl) {
  const books = feedEl.querySelectorAll('.book');
  if (books.length === 0) return null;
  const i = Math.round(feedEl.scrollTop / feedEl.clientHeight);
  return books[Math.min(Math.max(i, 0), books.length - 1)];
}

function turnPage(row, dir) {
  row.scrollBy({ left: dir * row.clientWidth, behavior: smooth() });
}

function moveBook(feedEl, dir) {
  feedEl.scrollBy({ top: dir * feedEl.clientHeight, behavior: smooth() });
}

function side(row, clientX) {
  const box = row.getBoundingClientRect();
  return clientX - box.left > box.width / 2 ? 1 : -1;
}

export function setupControls(feedEl) {
  let lastPointer = 'mouse';
  feedEl.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; });

  feedEl.addEventListener('click', (e) => {
    if (lastPointer !== 'mouse') return;
    if (e.target.closest('a, button, input, textarea, select')) return;
    if (String(window.getSelection())) return; // 글자를 드래그해 고르는 중이면 넘기지 않는다.
    const row = e.target.closest('.cards');
    if (row) turnPage(row, side(row, e.clientX));
  });

  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [role="tab"]')) return;
    const book = currentBook(feedEl);
    if (!book) return;
    const row = book.querySelector('.cards');
    const keys = {
      ArrowRight: () => turnPage(row, 1),
      ArrowLeft: () => turnPage(row, -1),
      ArrowDown: () => moveBook(feedEl, 1),
      PageDown: () => moveBook(feedEl, 1),
      ArrowUp: () => moveBook(feedEl, -1),
      PageUp: () => moveBook(feedEl, -1),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  });
}

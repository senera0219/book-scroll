// 시작점: 데이터 불러오기 → 탭과 피드 그리기 → 서비스 워커 등록.
import { TABS, loadBooks } from './content.js';
import { orderBooks } from './feed.js';
import { bookView, savedView, savedListView, openedBookView, tabsView, messageView, setSaveButton } from './render.js';
import { toggle, savedItems } from './bookmarks.js';
import * as storage from './storage.js';
import { setupControls } from './controls.js';
import { setupTextSize } from './textsize.js';
import { setupSettings, savedViewMode } from './settings.js';

const tabsEl = document.getElementById('tabs');
const feedEl = document.getElementById('feed');
tabsEl.setAttribute('role', 'tablist');

// 주제 탭 + 맨 끝 '저장함' 탭
const ALL_TABS = [...TABS, { id: 'saved', label: '★ 저장함' }];

let books = [];
let openBookId = null; // 저장함 목록에서 연 책
let currentTab = storage.get('tab', 'all');
if (!ALL_TABS.some((t) => t.id === currentTab)) currentTab = 'all';

function render() {
  tabsEl.replaceChildren(...tabsView(ALL_TABS, currentTab, selectTab));
  const listMode = currentTab === 'saved' && savedViewMode() === 'list';
  feedEl.classList.toggle('list-mode', listMode);
  if (currentTab === 'saved') {
    const items = savedItems(books);
    if (items.length === 0) {
      feedEl.replaceChildren(messageView('아직 저장한 카드가 없어요. 카드 아래 ☆ 저장을 눌러 보세요.'));
    } else {
      const opened = listMode && openBookId && books.find((b) => b.id === openBookId);
      if (opened) {
        feedEl.classList.remove('list-mode');
        feedEl.replaceChildren(...openedBookView(opened, () => history.back()));
        feedEl.scrollTop = 0;
        // 가장 최근에 저장한 카드가 있는 장에서 연다.
        const first = items.find((s) => s.book.id === opened.id);
        const page = !first ? 0 : first.card ? opened.cards.indexOf(first.card) : opened.cards.length;
        const row = feedEl.querySelector('.cards');
        row.scrollLeft = page * row.clientWidth;
        return;
      }
      feedEl.replaceChildren(...(listMode ? [savedListView(items, openBook)] : savedView(items)));
    }
  } else {
    const list = orderBooks(books, currentTab);
    if (list.length === 0) {
      feedEl.replaceChildren(messageView(
        books.length === 0 ? '아직 책이 없어요.' : '이 주제의 책은 아직 준비 중이에요.'));
    } else {
      feedEl.replaceChildren(...list.map((b, i) => bookView(b, i === 0)));
    }
  }
  feedEl.scrollTop = 0;
}

// 목록에서 책 열기: 뒤로 가기(휴대폰 뒤로 버튼 포함)로 목록에 돌아오게 기록을 남긴다.
function openBook(id) {
  openBookId = id;
  history.pushState({ openBook: id }, '');
  render();
}

window.addEventListener('popstate', () => {
  if (openBookId) {
    openBookId = null;
    render();
  }
});

function selectTab(id) {
  if (openBookId) {
    openBookId = null;
    history.replaceState(null, '');
  }
  currentTab = id;
  storage.set('tab', id);
  render();
}

// 저장 버튼: 누르면 저장/취소. 저장함에서 취소해도 다른 탭에 갔다 올 때까지 카드는 그대로 둔다.
feedEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.save');
  if (!btn) return;
  const saved = toggle(btn.dataset.bookId, btn.dataset.cardId);
  for (const b of feedEl.querySelectorAll('.save')) {
    if (b.dataset.cardId === btn.dataset.cardId) setSaveButton(b, saved);
  }
});

async function start() {
  try {
    books = await loadBooks();
  } catch {
    books = [];
  }
  render();
}

setupControls(feedEl);
setupTextSize();
// 설정이 바뀌면 저장함을 보고 있을 때만 다시 그린다.
setupSettings(() => {
  openBookId = null;
  if (currentTab === 'saved') render();
});
start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

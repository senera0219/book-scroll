// 시작점: 데이터 불러오기 → 탭과 피드 그리기 → 서비스 워커 등록.
import { TABS, loadBooks } from './content.js';
import { orderBooks } from './feed.js';
import { bookView, savedView, savedListView, tabsView, messageView, setSaveButton } from './render.js';
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
      feedEl.replaceChildren(...(listMode ? [savedListView(items)] : savedView(items)));
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

function selectTab(id) {
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
setupSettings(() => { if (currentTab === 'saved') render(); });
start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// 시작점: 데이터 불러오기 → 탭과 피드 그리기 → 서비스 워커 등록.
import { TABS, loadBooks } from './content.js';
import { orderBooks } from './feed.js';
import { bookView, tabsView, messageView } from './render.js';
import * as storage from './storage.js';

const tabsEl = document.getElementById('tabs');
const feedEl = document.getElementById('feed');
tabsEl.setAttribute('role', 'tablist');

let books = [];
let currentTab = storage.get('tab', 'all');
if (!TABS.some((t) => t.id === currentTab)) currentTab = 'all';

function render() {
  tabsEl.replaceChildren(...tabsView(TABS, currentTab, selectTab));
  const list = orderBooks(books, currentTab);
  if (list.length === 0) {
    feedEl.replaceChildren(messageView(
      books.length === 0 ? '아직 책이 없어요.' : '이 주제의 책은 아직 준비 중이에요.'));
  } else {
    feedEl.replaceChildren(...list.map((b, i) => bookView(b, i === 0)));
  }
  feedEl.scrollTop = 0;
}

function selectTab(id) {
  currentTab = id;
  storage.set('tab', id);
  render();
}

async function start() {
  try {
    books = await loadBooks();
  } catch {
    books = [];
  }
  render();
}

start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

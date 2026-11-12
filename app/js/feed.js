// 피드 순서: 탭으로 거르고, 전체 탭은 주제가 겹치지 않게 번갈아 놓는다.
// "안 읽은 책 먼저"는 읽음 기록이 생기는 #8에서 더한다.

export function orderBooks(books, tab) {
  if (tab !== 'all') return books.filter((b) => b.tab === tab);

  const byTab = new Map();
  for (const b of books) {
    if (!byTab.has(b.tab)) byTab.set(b.tab, []);
    byTab.get(b.tab).push(b);
  }
  const queues = [...byTab.values()];
  const out = [];
  while (queues.some((q) => q.length)) {
    for (const q of queues) if (q.length) out.push(q.shift());
  }
  return out;
}

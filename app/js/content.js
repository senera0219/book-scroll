// 카드 데이터 불러오기: content/index.json → 책 파일들.

export const TABS = [
  { id: 'all', label: '전체' },
  { id: 'literature', label: '문학' },
  { id: 'self-help', label: '자기계발' },
  { id: 'philosophy', label: '철학' },
  { id: 'society', label: '사회·정치' },
  { id: 'science', label: '과학·기술' },
];

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

export async function loadBooks() {
  const index = await getJson('content/index.json');
  const results = await Promise.allSettled(
    index.books.map((b) => getJson(`content/${b.file}`)),
  );
  return results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
}

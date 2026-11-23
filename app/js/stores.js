// 서점 검색 링크: 책 제목(또는 links.storeQuery)으로 서점마다 검색 주소를 만든다.
// 주소 모양이 바뀌면 여기 한 곳만 고친다.
const STORES = [
  { name: '알라딘', url: (q) => `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=${q}` },
  { name: '예스24', url: (q) => `https://www.yes24.com/Product/Search?domain=BOOK&query=${q}` },
  { name: '교보문고', url: (q) => `https://search.kyobobook.co.kr/search?keyword=${q}` },
  { name: '밀리의 서재', note: '로그인 필요', url: (q) => `https://www.millie.co.kr/v3/search/result/${q}` },
  { name: '리디', url: (q) => `https://ridibooks.com/search?q=${q}` },
];

export function storeLinks(book) {
  const q = encodeURIComponent(book.commentary.links.storeQuery || book.title);
  return STORES.map((s) => ({ name: s.name, note: s.note, url: s.url(q) }));
}

// 기기 저장소 창구. localStorage는 이 파일에서만 만진다(D-6).
// 2단계에서 서버 저장으로 바꿀 때 이 파일만 교체한다.

const KEY = 'book-scroll';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등): 기록 없이 계속 동작한다.
  }
}

export function get(name, fallback) {
  const all = readAll();
  return name in all ? all[name] : fallback;
}

export function set(name, value) {
  const all = readAll();
  all[name] = value;
  writeAll(all);
}

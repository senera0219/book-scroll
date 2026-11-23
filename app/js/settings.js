// 설정 창(⚙): 저장함 보기 방식 — 'list'(목록, 기본) 또는 'cards'(카드 그대로).
import * as storage from './storage.js';

const MODES = ['list', 'cards'];

export function savedViewMode() {
  const m = storage.get('savedView', 'list');
  return MODES.includes(m) ? m : 'list';
}

export function setupSettings(onChange) {
  const dialog = document.getElementById('settings');
  const open = document.getElementById('open-settings');
  const radios = dialog.querySelectorAll('input[name="savedView"]');

  open.addEventListener('click', () => {
    for (const r of radios) r.checked = r.value === savedViewMode();
    dialog.showModal();
  });

  for (const r of radios) {
    r.addEventListener('change', () => {
      storage.set('savedView', r.value);
      onChange();
    });
  }

  // 창 바깥(어두운 부분)을 누르면 닫는다.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}

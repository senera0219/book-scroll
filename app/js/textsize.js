// 글자 크기 버튼(설정 창의 가− / 가+): 본문·설명 글자만 키우고 줄인다. 고른 크기는 기기에 기억한다.
import * as storage from './storage.js';

const STEPS = [0.85, 1, 1.15, 1.3, 1.5, 1.7];
const NAMES = ['작게', '보통', '조금 크게', '크게', '더 크게', '아주 크게'];

export function setupTextSize() {
  const smaller = document.getElementById('text-smaller');
  const bigger = document.getElementById('text-bigger');
  const label = document.getElementById('text-size-label');
  let step = STEPS.indexOf(storage.get('textScale', 1));
  if (step < 0) step = 1;

  function apply() {
    document.documentElement.style.setProperty('--text-scale', String(STEPS[step]));
    smaller.disabled = step === 0;
    bigger.disabled = step === STEPS.length - 1;
    label.textContent = NAMES[step];
  }

  function change(dir) {
    step = Math.min(Math.max(step + dir, 0), STEPS.length - 1);
    storage.set('textScale', STEPS[step]);
    apply();
  }

  smaller.addEventListener('click', () => change(-1));
  bigger.addEventListener('click', () => change(1));
  apply();
}

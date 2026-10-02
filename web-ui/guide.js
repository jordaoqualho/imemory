'use strict';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// Botões "Copiar" da lista de comandos.
document.addEventListener('click', async e => {
  const button = e.target.closest('.copy');
  if (!button) return;
  const text = button.parentNode.querySelector('code').textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copiado';
    button.classList.add('done');
  } catch {
    button.textContent = 'Selecione e copie';
  }
  setTimeout(() => { button.textContent = 'Copiar'; button.classList.remove('done'); }, 1600);
});

// Acordeão do FAQ: anima a altura ao abrir e fechar, em vez do salto do <details>.
const running = new WeakMap();
function setOpen(item, open) {
  if (item.open === open && !running.has(item)) return;
  running.get(item)?.cancel();
  if (reduced.matches || !item.animate) { item.open = open; return; }
  const summary = item.querySelector('summary');
  const from = item.offsetHeight;
  if (open) item.open = true;
  const to = open ? item.scrollHeight : summary.offsetHeight;
  const anim = item.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: open ? 420 : 320, easing: 'cubic-bezier(.16,1,.3,1)' });
  running.set(item, anim);
  anim.onfinish = () => { running.delete(item); if (!open) item.open = false; syncToggle(); };
  anim.oncancel = () => running.delete(item);
}
const items = [...document.querySelectorAll('.faq-item')];
const toggle = document.getElementById('faq-toggle');
function syncToggle() {
  if (!toggle) return;
  const all = items.every(i => i.open);
  toggle.textContent = all ? 'Recolher todas' : 'Expandir todas';
  toggle.setAttribute('aria-pressed', String(all));
}
items.forEach(item => {
  item.querySelector('summary').addEventListener('click', e => {
    e.preventDefault();
    setOpen(item, !item.open);
    if (!item.open) syncToggle();
  });
  item.addEventListener('toggle', syncToggle);
});
toggle?.addEventListener('click', () => {
  const open = !items.every(i => i.open);
  items.forEach((item, k) => setTimeout(() => setOpen(item, open), reduced.matches ? 0 : k * 45));
});

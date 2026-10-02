'use strict';
// Movimento no estilo apple.com: revelação ao rolar, números que contam, manchete
// palavra a palavra, indicador da navegação e controle segmentado com deslize.
// Tudo é desligado quando o sistema pede "reduzir movimento".
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const moving = () => !reduce.matches;
  const sync = () => root.classList.toggle('motion', moving());
  root.classList.add('js');
  sync();
  reduce.addEventListener?.('change', sync);

  const REVEAL = '.metric,.card,.project-card,.guide,.g-card,.terminal,.section-title,.review-tile,.faq-item,.faq-intro';
  const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const escText = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  function countUp(el) {
    const target = Number(el.dataset.count);
    if (!moving() || !target) return;
    const start = performance.now(), duration = 1200;
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(target * easeOutExpo(t)).toLocaleString('pt-BR');
      if (t < 1 && el.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      io.unobserve(el);
      el.classList.add('in');
      if (el.dataset.count) countUp(el);
      el.querySelectorAll('[data-count]').forEach(countUp);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 }) : null;

  function reveal(scope) {
    if (!moving() || !io) return;
    const order = new Map();
    scope.querySelectorAll(REVEAL).forEach(el => {
      if (el.dataset.revealed) return;
      el.dataset.revealed = '1';
      const i = order.get(el.parentNode) || 0;
      order.set(el.parentNode, i + 1);
      el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
      el.classList.add('reveal');
      io.observe(el);
    });
  }
  // Ao terminar a revelação, devolve ao elemento as transições próprias de hover.
  document.addEventListener('transitionend', e => {
    const el = e.target;
    if (e.propertyName !== 'transform' || !el.classList?.contains('in')) return;
    el.classList.remove('reveal', 'in');
    el.style.removeProperty('--d');
  });

  function splitWords(el) {
    const text = el.textContent.trim();
    if (!text || (el.dataset.split === text && el.querySelector('.word'))) return;
    const animate = el.dataset.split !== text;
    el.dataset.split = text;
    el.innerHTML = text.split(/\s+/).map((w, i) => `<span class="word${animate ? '' : ' still'}" style="--i:${i}">${escText(w)}</span>`).join(' ');
  }

  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function placeThumbs(scope) {
    scope.querySelectorAll('.tabs').forEach(seg => {
      const thumb = seg.querySelector('.tabs-thumb');
      const on = seg.querySelector(':scope > [aria-checked="true"], :scope > [aria-current="true"]');
      if (!thumb || !on) return;
      thumb.style.width = on.offsetWidth + 'px';
      thumb.style.transform = `translateX(${on.offsetLeft}px)`;
      if (!seg.classList.contains('ready')) requestAnimationFrame(() => seg.classList.add('ready'));
    });
  }

  // Indicador deslizante sob o item ativo da navegação.
  const navList = document.querySelector('.primary-nav');
  if (navList) {
    const bar = document.createElement('span');
    bar.className = 'nav-indicator';
    bar.setAttribute('aria-hidden', 'true');
    navList.append(bar);
    const place = () => {
      const a = navList.querySelector('a.active');
      bar.style.opacity = a ? '1' : '0';
      if (!a) return;
      bar.style.width = a.offsetWidth + 'px';
      bar.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    new MutationObserver(place).observe(navList, { subtree: true, attributes: true, attributeFilter: ['class'] });
    addEventListener('resize', place);
    place();
    requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add('ready')));
  }

  // Manchete e subtítulo reanimam quando o portal troca de seção.
  const heading = document.querySelector('.hero h1');
  if (heading) {
    splitWords(heading);
    new MutationObserver(() => splitWords(heading)).observe(heading, { childList: true, characterData: true, subtree: true });
  }
  const subtitle = document.querySelector('.hero p');
  if (subtitle) {
    subtitle.style.setProperty('--delay', '180ms');
    subtitle.classList.add('fade-up');
    new MutationObserver(() => moving() && replay(subtitle, 'fade-up')).observe(subtitle, { childList: true, characterData: true });
  }

  const view = document.getElementById('view');
  if (view) {
    new MutationObserver(records => {
      const swapped = records.some(r => r.type === 'childList' && r.target === view);
      if (swapped && moving()) {
        replay(view, 'view-enter');
        view.querySelectorAll('.row-wrap').forEach((row, i) => {
          if (i > 11) return;
          row.style.setProperty('--i', i);
          row.classList.add('row-in');
        });
      }
      reveal(view);
      placeThumbs(view);
    }).observe(view, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-checked'] });
  }
  addEventListener('resize', () => placeThumbs(document));

  // Navegação ganha filete ao rolar. Nada mais anima durante a rolagem: o header
  // usa backdrop-filter e repintar o conteúdo por baixo dele a cada frame o faz piscar.
  const nav = document.querySelector('.global-nav');
  let scrolled = false;
  addEventListener('scroll', () => {
    const next = scrollY > 8;
    if (next === scrolled) return;
    scrolled = next;
    nav?.classList.toggle('scrolled', next);
  }, { passive: true });

  // Sugestões alternadas no campo de busca enquanto ele está vazio.
  const search = document.getElementById('search');
  if (search) {
    const tips = [search.placeholder, 'Por que escolhemos essa arquitetura?', 'Aquele erro de autenticação', 'Próximos passos do projeto', 'O que decidimos sobre o deploy?'];
    let n = 0;
    setInterval(() => {
      if (!moving() || search.value || document.activeElement === search || document.hidden || document.body.dataset.view === 'pages') return;
      search.classList.add('ph-swap');
      setTimeout(() => {
        n = (n + 1) % tips.length;
        search.placeholder = tips[n];
        search.classList.remove('ph-swap');
      }, 280);
    }, 4200);
  }

  reveal(document);
  placeThumbs(document);
})();

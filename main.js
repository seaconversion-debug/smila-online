/**
 * СмілаОнлайн — main.js
 * Новини Сміла | smila.online
 */

'use strict';

// === Рік у футері ===
const yearEl = document.getElementById('currentYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// === Smooth scroll ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const headerH = 100;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// === Active nav link on scroll ===
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
const headerEl = document.querySelector('.header');

if (sections.length && navLinks.length) {
  const activateLink = () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('nav__link--active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  };
  window.addEventListener('scroll', activateLink, { passive: true });
  activateLink();
}

// === Intersection Observer: fade-in ===
const fadeTargets = document.querySelectorAll('.about-card, .contact-card, .faq-item');
if ('IntersectionObserver' in window && fadeTargets.length) {
  fadeTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = '';
        }, i * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  fadeTargets.forEach(el => io.observe(el));
}

// ============================================================
// ALERT BAR: повітряна тривога + погода
// ============================================================
(function initAlertBar() {
  const dotEl = document.getElementById('alertDot');
  const textEl = document.getElementById('alertText');
  const weatherEl = document.getElementById('alertWeather');

  if (!dotEl || !textEl) return;

  const CHERKASY_REGION_ID = 24;

  async function checkAlert() {
    try {
      const r = await fetch(`https://siren.pp.ua/api/v3/alerts/${CHERKASY_REGION_ID}`, {
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/json' }
      });
      if (!r.ok) throw new Error('err');
      const data = await r.json();
      const region = Array.isArray(data) ? data[0] : data;
      const alerts = region?.activeAlerts || [];
      const isActive = alerts.length > 0;

      dotEl.className = 'alert-bar__dot ' + (isActive ? 'alert-bar__dot--danger' : 'alert-bar__dot--safe');
      textEl.textContent = isActive
        ? '🔴 Повітряна тривога в Черкаській обл.'
        : '🟢 Тривоги немає — Черкаська обл.';
    } catch {
      dotEl.className = 'alert-bar__dot alert-bar__dot--loading';
      textEl.textContent = '⚠️ Статус тривоги недоступний';
    }
  }

  async function checkWeather() {
    if (!weatherEl) return;
    try {
      const r = await fetch('https://wttr.in/Smiela,Ukraine?format=%t+%C&lang=uk', {
        signal: AbortSignal.timeout(5000)
      });
      if (!r.ok) throw new Error('err');
      const text = (await r.text()).trim().replace(/\+/g, '+');
      weatherEl.textContent = '⛅ ' + text + ' · Сміла';
    } catch {
      weatherEl.textContent = '';
    }
  }

  checkAlert();
  checkWeather();
  setInterval(checkAlert, 60 * 1000);   // кожну хвилину
  setInterval(checkWeather, 30 * 60 * 1000); // кожні 30 хв
})();

// ============================================================
// NEWS FEED
// ============================================================
(function initNewsFeed() {
  const grid = document.getElementById('newsGrid');
  const loadMoreWrap = document.getElementById('newsLoadMore');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const updatedAtEl = document.getElementById('newsUpdatedAt');

  if (!grid) return;

  const PAGE_SIZE = 9;
  let allItems = [];
  let filtered = [];
  let shown = 0;

  const TG_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.607c-.15.672-.543.836-1.1.52l-3.04-2.24-1.467 1.41c-.163.163-.3.3-.615.3l.22-3.11 5.667-5.12c.247-.22-.054-.342-.383-.122L7.19 14.43l-3.01-.94c-.655-.204-.667-.655.136-.97l11.74-4.525c.545-.197 1.022.133.506.253z" fill="currentColor"/></svg>`;

  function relativeTime(isoDate) {
    const diff = Date.now() - new Date(isoDate).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 2) return 'щойно';
    if (m < 60) return `${m} хв тому`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} год тому`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'вчора';
    if (d < 7) return `${d} дні тому`;
    return new Date(isoDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  }

  function isRecent(isoDate) {
    return Date.now() - new Date(isoDate).getTime() < 3 * 3600 * 1000;
  }

  function renderCard(item) {
    const card = document.createElement('article');
    card.className = `news-card news-card--${item.channelColor}`;
    card.setAttribute('itemscope', '');
    card.setAttribute('itemtype', 'https://schema.org/NewsArticle');

    const recentBadge = isRecent(item.date) ? '<span class="news-card__recent" aria-label="Нова публікація">🔴 Нове</span>' : '';
    const photoHtml = item.photo
      ? `<img class="news-card__photo" src="${item.photo}" alt="${item.title.replace(/"/g,'')}" loading="lazy" itemprop="image" onerror="this.remove()">`
      : '';

    const iso = new Date(item.date).toISOString();

    card.innerHTML = `
      <meta itemprop="datePublished" content="${iso}">
      <meta itemprop="publisher" content="СмілаОнлайн">
      <div class="news-card__meta">
        <span class="news-card__channel-badge">${item.channelIcon} ${item.channelName}</span>
        <time class="news-card__date" datetime="${iso}" itemprop="dateModified">${relativeTime(item.date)}</time>
        ${recentBadge}
      </div>
      ${photoHtml}
      <h3 class="news-card__title" itemprop="headline">${item.title}</h3>
      ${item.body ? `<p class="news-card__body" itemprop="description">${item.body}</p>` : ''}
      <div class="news-card__footer">
        <a href="${item.postUrl}?utm_source=smila_online&utm_medium=news_feed&utm_campaign=web2tg"
           target="_blank" rel="noopener"
           class="news-card__tg-link"
           itemprop="url"
           aria-label="Читати в Telegram: ${item.title.replace(/"/g,'')}">
          ${TG_SVG} Читати в Telegram
        </a>
        <a href="${item.channelTg}?utm_source=smila_online&utm_medium=subscribe"
           target="_blank" rel="noopener"
           class="news-card__subscribe">
          Підписатися
        </a>
      </div>
    `;
    return card;
  }

  function renderPage() {
    const slice = filtered.slice(shown, shown + PAGE_SIZE);
    if (slice.length === 0 && shown === 0) {
      grid.innerHTML = `<div class="news-empty" role="status"><div class="news-empty__icon">📭</div><p>Новини завантажуються...</p></div>`;
      return;
    }
    slice.forEach(item => grid.appendChild(renderCard(item)));
    shown += slice.length;
    grid.setAttribute('aria-busy', 'false');

    // fade-in нових карток
    if ('IntersectionObserver' in window) {
      const newCards = Array.from(grid.querySelectorAll('.news-card:not([data-vis])'));
      newCards.forEach((el, i) => {
        el.dataset.vis = '1';
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        setTimeout(() => { el.style.opacity = '1'; el.style.transform = ''; }, i * 50);
      });
    }

    const hasMore = shown < filtered.length;
    loadMoreWrap.style.display = (hasMore || updatedAtEl?.textContent) ? 'flex' : 'none';
    if (loadMoreBtn) loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
  }

  function applyFilter(channel) {
    filtered = channel === 'all' ? allItems : allItems.filter(i => i.channel === channel);
    shown = 0;
    grid.innerHTML = '';
    grid.setAttribute('aria-busy', 'true');
    renderPage();
  }

  document.querySelectorAll('.news-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.news-filter').forEach(b => {
        b.classList.remove('news-filter--active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('news-filter--active');
      btn.setAttribute('aria-selected', 'true');
      applyFilter(btn.dataset.channel);
    });
  });

  loadMoreBtn?.addEventListener('click', renderPage);

  // Завантаження stats.json (підписники)
  fetch('data/stats.json?v=' + Math.floor(Date.now() / 300000))
    .then(r => r.ok ? r.json() : null)
    .then(stats => {
      if (!stats) return;
      const el = document.getElementById('statSubscribers');
      if (el && stats.smila_novosti) {
        el.textContent = Number(stats.smila_novosti).toLocaleString('uk-UA') + '+';
      }
    })
    .catch(() => {});

  // Завантаження news.json
  fetch('data/news.json?v=' + Math.floor(Date.now() / 300000))
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(data => {
      allItems = data.items || [];
      if (data.updatedAt && updatedAtEl) {
        updatedAtEl.textContent = 'Оновлено: ' + relativeTime(data.updatedAt);
        loadMoreWrap.style.display = 'flex';
      }
      applyFilter('all');
    })
    .catch(() => {
      grid.innerHTML = `<div class="news-empty" role="alert"><div class="news-empty__icon">⚠️</div><p>Не вдалося завантажити новини. Спробуйте пізніше або <a href="https://t.me/smila_novosti" target="_blank" rel="noopener">читайте напряму в Telegram</a>.</p></div>`;
    });
})();

// ============================================================
// FAQ АКОРДЕОН
// ============================================================
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const isOpen = !answer.hidden;

    // Закрити всі
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-answer').hidden = true;
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    // Відкрити поточний (якщо не був відкритий)
    if (!isOpen) {
      item.classList.add('open');
      answer.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// ============================================================
// SCROLL CTA BANNER
// ============================================================
(function initScrollCta() {
  const cta = document.getElementById('scrollCta');
  const closeBtn = document.getElementById('scrollCtaClose');
  if (!cta) return;

  let shown = false;
  const dismissed = sessionStorage.getItem('scrollCtaDismissed');
  if (dismissed) return;

  const onScroll = () => {
    const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    if (!shown && scrolled > 0.65) {
      shown = true;
      cta.style.display = 'block';
      window.removeEventListener('scroll', onScroll);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  closeBtn?.addEventListener('click', () => {
    cta.style.display = 'none';
    sessionStorage.setItem('scrollCtaDismissed', '1');
  });
})();


// ============================================================
// BACK TO TOP
// ============================================================
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const THRESHOLD = 400;

  const onScroll = () => {
    if (window.scrollY > THRESHOLD) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ============================================================
// PWA Service Worker
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// UTM на всіх Telegram посиланнях (якщо ще немає)
document.querySelectorAll('a[href^="https://t.me/"]').forEach(link => {
  try {
    const url = new URL(link.href);
    if (!url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', 'smila_online');
      url.searchParams.set('utm_medium', 'website');
      link.href = url.toString();
    }
  } catch {}
});

console.info('%cСмілаОнлайн 🇺🇦 | smila.online', 'color:#005BBB;font-weight:800;font-size:13px;');

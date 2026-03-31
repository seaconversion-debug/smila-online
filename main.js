/**
 * Сміла Онлайн — main.js
 * Lightweight: < 3KB | No dependencies
 */

'use strict';

// === Smooth scroll for anchor links ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const headerH = document.querySelector('.header')?.offsetHeight || 60;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// === Header scroll shadow ===
const header = document.querySelector('.header');
if (header) {
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.style.boxShadow = y > 10
      ? '0 4px 20px rgba(0,0,0,0.12)'
      : '0 2px 12px rgba(0,0,0,0.08)';
    lastScroll = y;
  }, { passive: true });
}

// === Intersection Observer: fade-in on scroll ===
const observeTargets = document.querySelectorAll('.channel-card, .about-card, .bot-section__content');

if ('IntersectionObserver' in window && observeTargets.length) {
  // Reset CSS animation — let JS control it for below-fold elements
  observeTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    el.style.animationName = 'none'; // disable CSS @keyframes
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 80);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  observeTargets.forEach(el => io.observe(el));
}

// === Active nav link on scroll ===
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link[href^="#"]');

if (sections.length && navLinks.length) {
  const headerH = header?.offsetHeight || 60;

  const activateLink = () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - headerH - 32) {
        current = sec.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.style.color = link.getAttribute('href') === `#${current}`
        ? 'var(--blue)'
        : '';
    });
  };

  window.addEventListener('scroll', activateLink, { passive: true });
  activateLink();
}

// === UTM passthrough for Telegram links ===
// Adds ?utm_source=smila_online to t.me links for analytics
const tgLinks = document.querySelectorAll('a[href^="https://t.me/"]');
tgLinks.forEach(link => {
  const url = new URL(link.href);
  if (!url.searchParams.has('utm_source')) {
    url.searchParams.set('utm_source', 'smila_online');
    url.searchParams.set('utm_medium', 'website');
    link.href = url.toString();
  }
});

// === Bot command click animation ===
document.querySelectorAll('.bot-cmd').forEach(cmd => {
  cmd.addEventListener('click', function () {
    this.style.transform = 'scale(0.95)';
    setTimeout(() => { this.style.transform = ''; }, 150);
    // Open SmilaGobot on command click
    window.open('https://t.me/SmilaGobot?utm_source=smila_online&utm_medium=website', '_blank', 'noopener');
  });
});

// === Prefers-reduced-motion: disable animations ===
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.phone-mockup').forEach(el => {
    el.style.animation = 'none';
  });
}

console.info('%cСміла Онлайн 🇺🇦', 'color:#005BBB;font-weight:800;font-size:14px;');
console.info('GitHub: smila.online | Telegram: @smila_novosti');

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
  let activeFilter = 'all';

  const TG_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.607c-.15.672-.543.836-1.1.52l-3.04-2.24-1.467 1.41c-.163.163-.3.3-.615.3l.22-3.11 5.667-5.12c.247-.22-.054-.342-.383-.122L7.19 14.43l-3.01-.94c-.655-.204-.667-.655.136-.97l11.74-4.525c.545-.197 1.022.133.506.253z" fill="currentColor"/></svg>`;

  function relativeTime(isoDate) {
    const diff = Date.now() - new Date(isoDate).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'щойно';
    if (m < 60) return `${m} хв тому`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} год тому`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} д тому`;
    return new Date(isoDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  }

  function renderCard(item) {
    const card = document.createElement('article');
    card.className = `news-card news-card--${item.channelColor}`;

    const photoHtml = item.photo
      ? `<img class="news-card__photo" src="${item.photo}" alt="${item.title}" loading="lazy" onerror="this.remove()">`
      : '';

    card.innerHTML = `
      <div class="news-card__meta">
        <span class="news-card__channel-badge">${item.channelIcon} ${item.channelName}</span>
        <span class="news-card__date">${relativeTime(item.date)}</span>
      </div>
      ${photoHtml}
      <h3 class="news-card__title">${item.title}</h3>
      ${item.body ? `<p class="news-card__body">${item.body}</p>` : ''}
      <div class="news-card__footer">
        <a href="${item.postUrl}?utm_source=smila_online&utm_medium=news_feed"
           target="_blank" rel="noopener"
           class="news-card__tg-link"
           aria-label="Читати в Telegram: ${item.title}">
          ${TG_SVG} Читати в Telegram
        </a>
        <a href="${item.channelTg}?utm_source=smila_online&utm_medium=news_subscribe"
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
      grid.innerHTML = `<div class="news-empty"><div class="news-empty__icon">📭</div><p>Поки що немає публікацій</p></div>`;
      loadMoreWrap.style.display = 'none';
      return;
    }
    slice.forEach(item => grid.appendChild(renderCard(item)));
    shown += slice.length;

    // IO animation
    if ('IntersectionObserver' in window) {
      const newCards = Array.from(grid.querySelectorAll('.news-card:not([data-observed])'));
      newCards.forEach((el, i) => {
        el.dataset.observed = '1';
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        setTimeout(() => { el.style.opacity = '1'; el.style.transform = ''; }, i * 60);
      });
    }

    // Load more
    const hasMore = shown < filtered.length;
    loadMoreWrap.style.display = hasMore || updatedAtEl.textContent ? 'flex' : 'none';
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
  }

  function applyFilter(channel) {
    activeFilter = channel;
    filtered = channel === 'all' ? allItems : allItems.filter(i => i.channel === channel);
    shown = 0;
    grid.innerHTML = '';
    renderPage();
  }

  // Filter buttons
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

  // Load more
  loadMoreBtn && loadMoreBtn.addEventListener('click', renderPage);

  // Fetch data
  fetch('data/news.json?v=' + Date.now())
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(data => {
      allItems = data.items || [];
      if (data.updatedAt && updatedAtEl) {
        updatedAtEl.textContent = 'Оновлено: ' + relativeTime(data.updatedAt);
        loadMoreWrap.style.display = 'flex';
      }
      applyFilter(activeFilter);
    })
    .catch(() => {
      grid.innerHTML = `<div class="news-empty"><div class="news-empty__icon">⚠️</div><p>Не вдалося завантажити новини. Спробуйте пізніше.</p></div>`;
    });
})();

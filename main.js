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

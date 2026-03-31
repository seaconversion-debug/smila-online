# TECH_PLAN.md — Сайт мережі Telegram-каналів "Сміла"

## Технічний стек: Статичний HTML/CSS/JS

### Чому НЕ Next.js?

| Критерій | Static HTML/CSS/JS | Next.js |
|---|---|---|
| Час деплою | < 1 хв | 2-5 хв (build step) |
| Lighthouse | 95-100 | 85-95 (JS overhead) |
| Хостинг | Netlify Free | Netlify Free |
| Складність | Мінімальна | Середня |
| Залежності | 0 (npm packages) | 300+ mb node_modules |
| Оновлення контенту | Редагуй HTML | Редагуй JSX/MDX |

**Висновок:** Для сайту-агрегатора Telegram-каналів без динамічного контенту — статичний HTML оптимальний. Zero dependencies, миттєвий деплой, Lighthouse 95+.

---

## Структура файлів

```
smila-news/site/
├── index.html          # Головна сторінка
├── style.css           # Стилі (mobile-first)
├── main.js             # JS (анімації, UTM, lazy load)
├── netlify.toml        # Конфіг деплою
├── robots.txt          # SEO: дозволи для ботів
├── sitemap.xml         # SEO: карта сайту
└── TECH_PLAN.md        # Цей файл
```

---

## Кольорова схема

- **Primary Blue:** `#005BBB` (синій України)
- **Accent Yellow:** `#FFD700` (жовтий України)
- **White:** `#FFFFFF`
- **Dark:** `#1a1a2e` (текст)
- **Light Gray:** `#f5f7fa` (фон секцій)

---

## SEO стратегія

- Title: `Сміла Онлайн — Новини, Вакансії, Авто, Нерухомість`
- Description: геолокований, містить ключові слова
- OG теги для соцмереж (FB, Telegram preview)
- Twitter Card
- Structured Data (JSON-LD: WebSite + Organization)
- Canonical URL
- sitemap.xml з усіма сторінками
- robots.txt: дозволяємо всіх ботів

---

## Telegram інтеграція

- Прямі посилання через `https://t.me/channel_name` — найшвидший варіант
- Telegram Widget (`<script>` embed) — важкий (300+ KB), не рекомендований для Lighthouse 95+
- **Рішення:** Кастомні картки-посилання зі статистикою підписників (статично зашита), кнопка "Підписатися" → t.me link

---

## Netlify конфіг

- `netlify.toml`: headers для кешування, редиректи
- Cache-Control для статики: 1 рік
- HTML: no-cache (для SEO-оновлень)
- Security headers: X-Frame-Options, CSP

---

## Lighthouse оптимізації

1. CSS inline для critical path (above-the-fold)
2. `loading="lazy"` для зображень
3. Мінімальний JS (< 5KB)
4. Web fonts через `font-display: swap`
5. `preconnect` для зовнішніх ресурсів
6. Немає зовнішніх CSS фреймворків (Bootstrap, Tailwind)

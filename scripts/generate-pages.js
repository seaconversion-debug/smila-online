/**
 * generate-pages.js
 * Читає data/articles.json → генерує HTML-сторінки статей
 * Структура: articles/novyny/[slug]/index.html
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_FILE = resolve(__dirname, '../data/articles.json');
const SITE_ROOT = resolve(__dirname, '..');
const BASE_URL = 'https://smila.online';

const CITY = { name: 'Сміла', region: 'Черкаська область' };

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateMachine(iso) {
  return new Date(iso).toISOString().split('T')[0];
}

function buildArticlePage(article) {
  const url = `${BASE_URL}/${article.categoryPath}/${article.slug}/`;
  const bodyHtml = article.body
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('\n      ');

  const tagsHtml = (article.tags || [])
    .map(t => `<span class="article-tag">${t}</span>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="uk" itemscope itemtype="https://schema.org/NewsArticle">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title}</title>
  <meta name="description" content="${article.metaDescription}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <link rel="canonical" href="${url}">

  <!-- OG -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${article.title}">
  <meta property="og:description" content="${article.metaDescription}">
  <meta property="og:image" content="${BASE_URL}/og-image.jpg">
  <meta property="og:locale" content="uk_UA">
  <meta property="og:site_name" content="СмілаОнлайн">
  <meta property="article:published_time" content="${article.publishedAt}">
  <meta property="article:modified_time" content="${article.updatedAt}">
  <meta property="article:section" content="${article.categoryLabel}">
  ${(article.tags || []).map(t => `<meta property="article:tag" content="${t}">`).join('\n  ')}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${article.title}">
  <meta name="twitter:description" content="${article.metaDescription}">

  <!-- Schema NewsArticle -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${article.h1 || article.title}",
    "description": "${article.metaDescription}",
    "url": "${url}",
    "datePublished": "${article.publishedAt}",
    "dateModified": "${article.updatedAt}",
    "author": {
      "@type": "Organization",
      "name": "СмілаОнлайн",
      "url": "${BASE_URL}"
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "СмілаОнлайн",
      "url": "${BASE_URL}",
      "logo": {
        "@type": "ImageObject",
        "url": "${BASE_URL}/og-image.jpg"
      }
    },
    "image": "${BASE_URL}/og-image.jpg",
    "inLanguage": "uk-UA",
    "keywords": "${(article.tags || []).join(', ')}",
    "articleSection": "${article.categoryLabel}",
    "about": {
      "@type": "Place",
      "name": "${CITY.name}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${CITY.name}",
        "addressRegion": "${CITY.region}",
        "addressCountry": "UA"
      }
    }
  }
  </script>

  <!-- BreadcrumbList -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type":"ListItem","position":1,"name":"Головна","item":"${BASE_URL}/"},
      {"@type":"ListItem","position":2,"name":"${article.categoryLabel}","item":"${BASE_URL}/${article.categoryPath}/"},
      {"@type":"ListItem","position":3,"name":"${article.h1 || article.title}","item":"${url}"}
    ]
  }
  </script>

  <link rel="stylesheet" href="${BASE_URL}/style.css">
  <link rel="preconnect" href="https://t.me">
  <meta name="theme-color" content="#005BBB">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='16' fill='%23005BBB'/><rect y='16' width='32' height='16' fill='%23FFD700'/><text x='16' y='22' text-anchor='middle' font-size='14' fill='white'>С</text></svg>">
</head>
<body>

  <!-- HEADER -->
  <header class="header">
    <div class="container header__inner">
      <a href="/" class="logo" aria-label="СмілаОнлайн — головна">
        <span class="logo__icon">🇺🇦</span>
        <span class="logo__text">Сміла<strong>Онлайн</strong></span>
      </a>
      <nav class="nav" aria-label="Навігація">
        <a href="/#channels" class="nav__link">Канали</a>
        <a href="/#news" class="nav__link">Новини</a>
        <a href="/#contacts" class="nav__link">Контакти</a>
        <a href="/#faq" class="nav__link">FAQ</a>
      </nav>
      <a href="https://t.me/smila_novosti" target="_blank" rel="noopener" class="btn btn--header">
        Читати новини
      </a>
    </div>
  </header>

  <!-- ARTICLE -->
  <main class="article-main">
    <div class="container">

      <!-- BREADCRUMBS -->
      <nav class="breadcrumbs" aria-label="Хлібні крихти">
        <ol itemscope itemtype="https://schema.org/BreadcrumbList">
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a href="/" itemprop="item"><span itemprop="name">Головна</span></a>
            <meta itemprop="position" content="1">
          </li>
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a href="/${article.categoryPath}/" itemprop="item"><span itemprop="name">${article.categoryLabel}</span></a>
            <meta itemprop="position" content="2">
          </li>
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <span itemprop="name">${article.h1 || article.title}</span>
            <meta itemprop="position" content="3">
          </li>
        </ol>
      </nav>

      <article class="article" itemscope itemtype="https://schema.org/NewsArticle">
        <meta itemprop="url" content="${url}">
        <meta itemprop="datePublished" content="${article.publishedAt}">
        <meta itemprop="dateModified" content="${article.updatedAt}">
        <meta itemprop="inLanguage" content="uk-UA">

        <header class="article__header">
          <div class="article__meta">
            <span class="article__category">
              <a href="/${article.categoryPath}/">${article.categoryLabel}</a>
            </span>
            <time class="article__date" datetime="${formatDateMachine(article.publishedAt)}" itemprop="datePublished">
              ${formatDate(article.publishedAt)}
            </time>
          </div>
          <h1 class="article__title" itemprop="headline">${article.h1 || article.title}</h1>
          <p class="article__lead" itemprop="description">${article.metaDescription}</p>
        </header>

        <div class="article__body" itemprop="articleBody">
          ${bodyHtml}
        </div>

        <footer class="article__footer">
          <div class="article__tags" aria-label="Теги">
            ${tagsHtml}
          </div>

          <div class="article__source">
            <p>Першоджерело: <a href="${article.sourceUrl}?utm_source=smila_online&utm_medium=article&utm_campaign=source" target="_blank" rel="noopener">Telegram @${article.sourceChannel}</a></p>
          </div>

          <div class="article__tg-cta">
            <p>Більше новин ${CITY.name} — в нашому Telegram-каналі</p>
            <a href="https://t.me/smila_novosti?utm_source=smila_online&utm_medium=article_cta&utm_campaign=subscribe"
               target="_blank" rel="noopener" class="btn btn--primary">
              Підписатися на @smila_novosti
            </a>
          </div>
        </footer>
      </article>

    </div>
  </main>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <a href="/" class="logo logo--footer">
          <span class="logo__icon">🇺🇦</span>
          <span class="logo__text">Сміла<strong>Онлайн</strong></span>
        </a>
        <p class="footer__tagline">Новини міста Сміла щодня</p>
      </div>
      <nav class="footer__channels" aria-label="Telegram-канали">
        <h4 class="footer__nav-title">Telegram-канали</h4>
        <ul>
          <li><a href="https://t.me/smila_novosti" target="_blank" rel="noopener">📰 Новини Сміла</a></li>
          <li><a href="https://t.me/robota_smila_ua" target="_blank" rel="noopener">💼 Вакансії Сміла</a></li>
          <li><a href="https://t.me/autobazar_smila" target="_blank" rel="noopener">🚗 Автобазар Сміла</a></li>
          <li><a href="https://t.me/smila_neruhomist" target="_blank" rel="noopener">🏠 Нерухомість Сміла</a></li>
        </ul>
      </nav>
      <div class="footer__contact">
        <h4 class="footer__nav-title">Контакти</h4>
        <ul>
          <li><a href="https://t.me/SmilaGobot" target="_blank" rel="noopener">🤖 @SmilaGobot</a></li>
          <li><a href="https://t.me/Smila_admin" target="_blank" rel="noopener">✉️ @Smila_admin</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="container">
        <p>© ${new Date().getFullYear()} СмілаОнлайн. Всі права захищені.</p>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

function generateSitemapEntries(articles) {
  return articles.map(a => {
    const url = `${BASE_URL}/${a.categoryPath}/${a.slug}/`;
    const date = formatDateMachine(a.publishedAt);
    return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
  }).join('\n');
}

async function main() {
  if (!existsSync(ARTICLES_FILE)) {
    console.error('❌ data/articles.json not found. Run rewrite-articles.js first.');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(ARTICLES_FILE, 'utf-8'));
  const articles = data.articles || [];

  console.log(`📄 Генерація ${articles.length} сторінок статей...`);

  let generated = 0;
  for (const article of articles) {
    const dir = resolve(SITE_ROOT, article.categoryPath, article.slug);
    mkdirSync(dir, { recursive: true });
    const html = buildArticlePage(article);
    writeFileSync(resolve(dir, 'index.html'), html, 'utf-8');
    console.log(`  ✅ /${article.categoryPath}/${article.slug}/`);
    generated++;
  }

  // Генеруємо категорійні сторінки
  const categories = [...new Set(articles.map(a => a.categoryPath))];
  for (const cat of categories) {
    const catArticles = articles.filter(a => a.categoryPath === cat);
    const catLabel = catArticles[0]?.categoryLabel || cat;
    generateCategoryPage(cat, catLabel, catArticles);
  }

  // Оновлюємо sitemap.xml
  const existingSitemap = readFileSync(resolve(SITE_ROOT, 'sitemap.xml'), 'utf-8');
  const newEntries = generateSitemapEntries(articles);
  const updatedSitemap = existingSitemap.replace('</urlset>', `${newEntries}\n</urlset>`);
  writeFileSync(resolve(SITE_ROOT, 'sitemap.xml'), updatedSitemap, 'utf-8');

  console.log(`\n✅ Згенеровано: ${generated} статей, ${categories.length} категорій`);
  console.log(`📍 sitemap.xml оновлено (+${articles.length} URL)`);
}

function generateCategoryPage(categoryPath, categoryLabel, articles) {
  const url = `${BASE_URL}/${categoryPath}/`;
  const cardsHtml = articles.map(a => {
    const articleUrl = `/${a.categoryPath}/${a.slug}/`;
    return `
    <article class="news-card news-card--blue">
      <div class="news-card__meta">
        <span class="news-card__channel-badge">${a.categoryLabel}</span>
        <time class="news-card__date" datetime="${formatDateMachine(a.publishedAt)}">${formatDate(a.publishedAt)}</time>
      </div>
      <h2 class="news-card__title"><a href="${articleUrl}">${a.h1 || a.title}</a></h2>
      <p class="news-card__body">${a.metaDescription}</p>
      <div class="news-card__footer">
        <a href="${articleUrl}" class="news-card__tg-link">Читати →</a>
      </div>
    </article>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${categoryLabel} Сміла — ${BASE_URL.replace('https://', '')}</title>
  <meta name="description" content="${categoryLabel} міста Сміла. Актуальні матеріали з Черкаської області щодня.">
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${categoryLabel} Сміла">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE_URL}/og-image.jpg">
  <link rel="stylesheet" href="${BASE_URL}/style.css">
  <meta name="theme-color" content="#005BBB">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='16' fill='%23005BBB'/><rect y='16' width='32' height='16' fill='%23FFD700'/><text x='16' y='22' text-anchor='middle' font-size='14' fill='white'>С</text></svg>">
</head>
<body>
  <header class="header">
    <div class="container header__inner">
      <a href="/" class="logo"><span class="logo__icon">🇺🇦</span><span class="logo__text">Сміла<strong>Онлайн</strong></span></a>
      <nav class="nav">
        <a href="/#news" class="nav__link">Новини</a>
        <a href="/#contacts" class="nav__link">Контакти</a>
      </nav>
    </div>
  </header>
  <main>
    <div class="container" style="padding-top:2rem;padding-bottom:4rem">
      <nav class="breadcrumbs" aria-label="Хлібні крихти">
        <ol>
          <li><a href="/">Головна</a></li>
          <li>${categoryLabel}</li>
        </ol>
      </nav>
      <h1 style="font-size:2rem;font-weight:800;margin:1.5rem 0 0.5rem">${categoryLabel} Сміли</h1>
      <p style="color:#6b7a99;margin-bottom:2rem">Актуальні матеріали міста Сміла, Черкаська область</p>
      <div class="news-grid">
        ${cardsHtml}
      </div>
    </div>
  </main>
  <footer class="footer">
    <div class="footer__bottom"><div class="container"><p>© ${new Date().getFullYear()} СмілаОнлайн</p></div></div>
  </footer>
</body>
</html>`;

  const dir = resolve(SITE_ROOT, categoryPath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf-8');
  console.log(`  📁 /${categoryPath}/ (${articles.length} статей)`);
}

main().catch(e => { console.error(e); process.exit(1); });

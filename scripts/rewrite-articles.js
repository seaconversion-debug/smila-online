/**
 * rewrite-articles.js
 * Читає data/news.json → рерайт через Gemini → зберігає data/articles.json
 * Запуск: node scripts/rewrite-articles.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEWS_FILE    = resolve(__dirname, '../data/news.json');
const ARTICLES_FILE = resolve(__dirname, '../data/articles.json');

// Конфіг міста
const CITY = {
  name: 'Сміла',
  nameGen: 'Сміли',       // родовий відмінок
  namePrep: 'Смілі',      // місцевий відмінок
  region: 'Черкаська область',
  url: 'smila.online',
};

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

// Категорії які рерайтимо (авто і нерухомість — не новини)
const NEWS_CHANNELS = ['smila_novosti', 'robota_smila_ua'];

// Максимум нових статей за один запуск
const MAX_NEW = 10;

// Затримка між запитами (rate limit)
const DELAY_MS = 1500;

function slugify(text) {
  const map = {
    'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ie','ж':'zh',
    'з':'z','и':'y','і':'i','ї':'i','й':'y','к':'k','л':'l','м':'m','н':'n',
    'о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
    'ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'iu','я':'ia',
    ' ':'-','.':'',',':'','!':'','?':'','"':'','«':'','»':'','(':'',')':'',
    ':':'','/':'-','–':'-','—':'-'
  };
  return text.toLowerCase()
    .split('').map(c => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function categoryFromChannel(channel) {
  const map = {
    smila_novosti:    { id: 'novyny',   label: 'Новини', path: 'novyny' },
    robota_smila_ua:  { id: 'vakansii', label: 'Вакансії', path: 'vakansii' },
  };
  return map[channel] || { id: 'novyny', label: 'Новини', path: 'novyny' };
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function rewritePost(post) {
  const cat = categoryFromChannel(post.channel);
  const inputText = [post.title, post.body].filter(Boolean).join('\n').trim().slice(0, 1000);

  const prompt = `Ти — редактор місцевого новинного видання міста ${CITY.name}, ${CITY.region}, Україна.

Перетвори короткий Telegram-пост на унікальну SEO-статтю. Відповідай ТІЛЬКИ валідним JSON без markdown.

Telegram-пост:
"""
${inputText}
"""

Категорія: ${cat.label}
Місто: ${CITY.name} (${CITY.region})
Дата публікації: ${post.date.slice(0, 10)}

Правила:
- title: 45-65 символів, містить "${CITY.nameGen}" або "${CITY.namePrep}", відповідає темі
- metaDescription: 120-155 символів для Google
- h1: може відрізнятись від title, природній заголовок статті
- body: унікальна стаття 150-200 слів, 2-3 абзаци, природні ключові слова, корисно для читача
- slug: транслітерований slug латинкою, 4-7 слів, без дат
- tags: 3-5 тегів українською
- Не повторюй title в першому реченні body
- Уникай кліше та штампів

Поверни ТІЛЬКИ валідний JSON (без markdown, без пояснень):
{"title":"...","metaDescription":"...","h1":"...","body":"...","slug":"...","tags":["..."]}`;

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      }
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini HTTP ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    const reason = data?.candidates?.[0]?.finishReason;
    throw new Error(`Empty Gemini response, finishReason: ${reason}, keys: ${Object.keys(data).join(',')}`);
  }

  // Витягуємо JSON — шукаємо перший { ... } блок незалежно від markdown обгортки
  const jsonMatch = raw.match(/\{[\s\S]*?\}(?=\s*$|\s*```)/s) || raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response: ' + raw.slice(0, 300));

  const article = JSON.parse(jsonMatch[0]);

  // Збагачуємо метаданими
  article.id = post.id;
  article.sourceChannel = post.channel;
  article.sourceUrl = post.postUrl;
  article.category = cat.id;
  article.categoryLabel = cat.label;
  article.categoryPath = cat.path;
  article.publishedAt = post.date;
  article.updatedAt = new Date().toISOString();
  article.city = CITY.name;
  article.slug = slugify(article.slug || article.title);

  return article;
}

async function main() {
  if (!GEMINI_KEY) {
    console.error('❌ GEMINI_API_KEY not set');
    process.exit(1);
  }

  // Завантажуємо вже оброблені статті
  let existing = [];
  if (existsSync(ARTICLES_FILE)) {
    try {
      const data = JSON.parse(readFileSync(ARTICLES_FILE, 'utf-8'));
      existing = data.articles || [];
    } catch {}
  }
  const processedIds = new Set(existing.map(a => a.id));

  // Завантажуємо свіжі новини
  const news = JSON.parse(readFileSync(NEWS_FILE, 'utf-8'));
  const toProcess = (news.items || [])
    .filter(p => NEWS_CHANNELS.includes(p.channel))
    .filter(p => !processedIds.has(p.id))
    .filter(p => p.title && p.title.length > 15)
    .slice(0, MAX_NEW);

  console.log(`📰 Нових постів для рерайту: ${toProcess.length}`);

  const newArticles = [];
  for (const post of toProcess) {
    try {
      console.log(`  ✏️  ${post.id}: ${post.title.slice(0, 60)}`);
      const article = await rewritePost(post);
      newArticles.push(article);
      console.log(`  ✅ → /${article.categoryPath}/${article.slug}/`);
      await sleep(DELAY_MS);
    } catch (e) {
      console.error(`  ❌ ${post.id}: ${e.message}`);
      await sleep(DELAY_MS);
    }
  }

  // Зберігаємо
  const allArticles = [...newArticles, ...existing]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const output = {
    updatedAt: new Date().toISOString(),
    total: allArticles.length,
    articles: allArticles,
  };

  writeFileSync(ARTICLES_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ Збережено ${allArticles.length} статей → data/articles.json`);
  console.log(`   Нових: ${newArticles.length}, існуючих: ${existing.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });

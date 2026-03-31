/**
 * fetch-news.js — GitHub Actions скрипт
 * Парсить публічні Telegram канали → data/news.json
 * Запускається: node scripts/fetch-news.js
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const SITE_URL = 'https://seaconversion-debug.github.io/smila-online';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, '../data/news.json');

const CHANNELS = [
  {
    id: 'smila_novosti',
    name: 'Сміла | Новини',
    icon: '📰',
    color: 'blue',
    url: 'https://t.me/s/smila_novosti',
    tg: 'https://t.me/smila_novosti',
  },
  {
    id: 'robota_smila_ua',
    name: 'Робота у Смілі',
    icon: '💼',
    color: 'green',
    url: 'https://t.me/s/robota_smila_ua',
    tg: 'https://t.me/robota_smila_ua',
  },
  {
    id: 'autobazar_smila',
    name: 'Автобазар Сміла',
    icon: '🚗',
    color: 'orange',
    url: 'https://t.me/s/autobazar_smila',
    tg: 'https://t.me/autobazar_smila',
  },
  {
    id: 'smila_neruhomist',
    name: 'Нерухомість Сміла',
    icon: '🏠',
    color: 'purple',
    url: 'https://t.me/s/smila_neruhomist',
    tg: 'https://t.me/smila_neruhomist',
  },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

async function fetchChannel(ch) {
  const items = [];
  try {
    const res = await fetch(ch.url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'uk-UA,uk;q=0.9' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error(`[${ch.id}] HTTP ${res.status}`);
      return items;
    }
    const html = await res.text();

    // Парсинг повідомлень
    const msgRegex = /<div class="tgme_widget_message_wrap[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
    const textRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/;
    const dateRegex = /<time[^>]+datetime="([^"]+)"/;
    const linkRegex = /https:\/\/t\.me\/[a-zA-Z0-9_]+\/(\d+)/;
    const photoRegex = /<a class="tgme_widget_message_photo_wrap[^"]*"[^>]*style="background-image:url\('([^']+)'\)/;

    // Простіший підхід — розбиваємо по блоках повідомлень
    const blocks = html.split('tgme_widget_message_wrap');
    for (const block of blocks.slice(1)) {
      try {
        // Дата
        const dateMatch = block.match(dateRegex);
        if (!dateMatch) continue;
        const date = dateMatch[1];

        // Посилання на пост
        const linkMatch = block.match(linkRegex);
        if (!linkMatch) continue;
        const postId = linkMatch[1];
        const postUrl = `https://t.me/${ch.id}/${postId}`;

        // Текст
        const textMatch = block.match(textRegex);
        let text = '';
        if (textMatch) {
          text = textMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .trim();
        }

        if (!text || text.length < 10) continue;

        // Фото (якщо є)
        const photoMatch = block.match(photoRegex);
        const photo = photoMatch ? photoMatch[1] : null;

        // Перший рядок як заголовок
        const lines = text.split('\n').filter(l => l.trim());
        const title = lines[0].replace(/^[#📰💼🚗🏠⚡🔴🟢✅❌⚠️🗺️📍🏙️]+\s*/, '').trim().slice(0, 120);
        const body = lines.slice(1).join(' ').trim().slice(0, 300);

        items.push({
          id: `${ch.id}_${postId}`,
          channel: ch.id,
          channelName: ch.name,
          channelIcon: ch.icon,
          channelColor: ch.color,
          channelTg: ch.tg,
          postUrl,
          title: title || text.slice(0, 120),
          body: body || '',
          photo,
          date,
          ts: new Date(date).getTime(),
        });
      } catch (e) {
        // skip bad block
      }
    }

    console.log(`[${ch.id}] отримано ${items.length} постів`);
  } catch (e) {
    console.error(`[${ch.id}] помилка: ${e.message}`);
  }
  return items;
}

async function main() {
  console.log('🔄 Оновлення стрічки новин...');

  // Завантажуємо старі дані для merge
  let oldItems = [];
  if (existsSync(DATA_FILE)) {
    try {
      const old = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
      oldItems = old.items || [];
    } catch {}
  }

  // Парсимо всі канали паралельно
  const results = await Promise.all(CHANNELS.map(fetchChannel));
  const newItems = results.flat();

  // Merge: старі + нові, унікальні по id
  const allById = new Map();
  for (const item of [...oldItems, ...newItems]) {
    allById.set(item.id, item);
  }

  // Сортуємо: найновіші першими, обрізаємо до 200
  const items = Array.from(allById.values())
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 200);

  const data = {
    updatedAt: new Date().toISOString(),
    total: items.length,
    items,
  };

  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Збережено ${items.length} постів → data/news.json`);
}

main().catch(e => { console.error(e); process.exit(1); });

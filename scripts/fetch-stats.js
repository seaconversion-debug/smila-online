/**
 * fetch-stats.js — GitHub Actions скрипт
 * Отримує кількість підписників Telegram-каналів → data/stats.json
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, '../data/stats.json');

const CHANNELS = ['smila_novosti', 'robota_smila_ua', 'autobazar_smila', 'smila_neruhomist'];

async function getMembers(channel) {
  try {
    // Парсимо публічну сторінку
    const r = await fetch(`https://t.me/s/${channel}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await r.text();

    // Спробувати counter_value (найточніший спосіб)
    const counterMatch = html.match(/counter_value">(\d[\d\s]*)<\/span>\s*<span class="counter_type">(?:subscriber|member)/i);
    if (counterMatch) {
      return parseInt(counterMatch[1].replace(/\s/g, ''), 10);
    }

    // Fallback: загальна перевірка
    const match = html.match(/(\d[\d\s]{0,6})\s*(?:subscriber|member|підписник)/i)
      || html.match(/tgme_page_extra[^>]*>\s*([\d\s]+)/);
    if (match) {
      return parseInt(match[1].replace(/\s/g, ''), 10);
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('📊 Оновлення статистики підписників...');
  const stats = { updatedAt: new Date().toISOString() };

  for (const ch of CHANNELS) {
    const count = await getMembers(ch);
    stats[ch] = count;
    console.log(`  ${ch}: ${count ?? 'n/a'}`);
  }

  writeFileSync(DATA_FILE, JSON.stringify(stats, null, 2), 'utf8');
  console.log('✅ data/stats.json збережено');
}

main().catch(e => { console.error(e); process.exit(1); });

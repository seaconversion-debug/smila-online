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
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await r.text();
    // Шукаємо кількість підписників
    const match = html.match(/(\d[\d\s]*)\s*(?:subscriber|member|підписник)/i)
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

import { chromium } from 'playwright';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzaTeSftC1pLG7vN2SsnrZvEcjmzf6-8etd5fvDS_H9dFC5kdVS66kj1f6O41BEdkZxGg/exec';
const supabase = createClient(
  'https://ssrdcsrmifoexueivfls.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

(async () => {
  console.log('▶️ Iniciando navegador...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Login com cookies
  const cookies = JSON.parse(await fs.readFile('./cookies.json', 'utf-8'));
  await context.addCookies(cookies);

  const page = await context.newPage();
  console.log('🌐 Indo para página de arbitragens...');
  await page.goto('https://pt.surebet.com/surebets');

  // Desmarca 3 seleções, se marcada
  const checkbox3 = await page.$('#selector_outcomes_3');
  if (checkbox3 && await checkbox3.isChecked()) {
    await checkbox3.click();
    console.log('☑️ Desmarcando seleções de 3 resultados...');
  }

  // Clica no botão "Filtrar"
  const btn = await page.$('input#ft.btn.btn-primary.mb-2');
  if (btn) await btn.click();

  await delay(8000); // espera carregar

  const oportunidades = await page.evaluate(() => {
    const linhas = [];
    document.querySelectorAll('tbody.surebet_record').forEach((el) => {
      try {
        const groupSize = parseInt(el.getAttribute('data-group-size') || '0');
        if (groupSize !== 2) return;

        const lucro = el.querySelector('.profit')?.innerText.trim() || '';
        const tempo = el.querySelector('.age')?.innerText.trim() || '';

        const casas = el.querySelectorAll('td.booker');
        const casa1 = casas[0]?.innerText.split('\n')[0]?.trim() || '';
        const esporte1 = casas[0]?.querySelector('span.minor')?.innerText.trim() || 'Futebol';
        const casa2 = casas[1]?.innerText.split('\n')[0]?.trim() || '';
        const esporte2 = casas[1]?.querySelector('span.minor')?.innerText.trim() || 'Futebol';

        const abbrs = el.querySelectorAll('td.time abbr');
        const data = abbrs[0]?.innerHTML.split('<br>')[0]?.trim() || '';
        const hora = abbrs[0]?.innerHTML.split('<br>')[1]?.trim() || '';

        const eventos = el.querySelectorAll('td.event a');
        const evento1 = eventos[0]?.innerText.trim() || '';
        const evento2 = eventos[1]?.innerText.trim() || '';

        const descEv1 = eventos[0]?.parentElement?.querySelector('span.minor')?.innerText.trim() || '';
        const descEv2 = eventos[1]?.parentElement?.querySelector('span.minor')?.innerText.trim() || '';

        const mercados = el.querySelectorAll('td.coeff abbr');
        const mercado1 = mercados[0]?.innerText.trim() || '';
        const mercado2 = mercados[1]?.innerText.trim() || '';

        const odds = el.querySelectorAll('td.value a.value_link');
        const odd1 = odds[0]?.innerText.trim() || '';
        const odd2 = odds[1]?.innerText.trim() || '';

        const linkcasa1 = 'https://pt.surebet.com' + (odds[0]?.getAttribute('href') || '');
        const linkcasa2 = 'https://pt.surebet.com' + (odds[1]?.getAttribute('href') || '');

        linhas.push([
          lucro, tempo, casa1, esporte1, casa2, esporte2,
          data, hora, evento1, descEv1, evento2, descEv2,
          mercado1, odd1, mercado2, odd2, linkcasa1, linkcasa2
        ]);
      } catch (e) {
        console.warn('❌ Erro bloco:', e);
      }
    });
    return linhas;
  });

  console.log(`✅ Extraído: ${oportunidades.length} linhas`);

  for (const linha of oportunidades) {
    const [
      lucro, tempo, casa1, esporte1, casa2, esporte2,
      data, hora, evento1, descEv1, evento2, descEv2,
      mercado1, odd1, mercado2, odd2, link1, link2
    ] = linha;

    // Google Sheets
    const params = new URLSearchParams({
      lucro, tempo, casa1, esporte1, casa2, esporte2,
      data, hora, evento1, descev1: descEv1, evento2, descev2: descEv2,
      mercado1, odd1, mercado2, odd2, linkcasa1: link1, linkcasa2: link2
    });
    await fetch(`${SHEETS_URL}?${params.toString()}`);
    console.log(`📄 Enviado ao Sheets: ${evento1} – ${evento2}`);

    // Supabase
    await supabase.from('arbs').insert({
      id: `${evento1}-${evento2}`.substring(0, 60),
      lucro, tempo, casa1, esporte1, casa2, esporte2,
      data, hora, evento1, descEv1, evento2, descEv2,
      mercado1, odd1, mercado2, odd2,
      linkcasa1: link1, linkcasa2: link2
    }, { returning: 'minimal' });
    console.log(`📦 Enviado ao Supabase: ${evento1} – ${evento2}`);
  }

  await browser.close();
})();

import { chromium } from 'playwright';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzaTeSftC1pLG7vN2SsnrZvEcjmzf6-8etd5fvDS_H9dFC5kdVS66kj1f6O41BEdkZxGg/exec';
const supabase = createClient(
  'https://ssrdcsrmifoexueivfls.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcmRjc3JtaWZvZXh1ZWl2ZmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgxNjM1OCwiZXhwIjoyMDY4MzkyMzU4fQ.8lK6UKsNPh3Ikll53YBbdpmGv0aWQQKuMYk9zsIiK54'
);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('▶️ Iniciando navegador...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Aplica os cookies salvos
  const cookies = JSON.parse(await fs.readFile('./cookies.json', 'utf8'));
  await context.addCookies(cookies);

  const page = await context.newPage();

  console.log('🌐 Acessando página de arbitragens...');
  await page.goto('https://pt.surebet.com/surebets', { waitUntil: 'domcontentloaded' });

  // Desmarca o 3 seleções se estiver marcado e aplica o filtro
  try {
    const selector3 = 'label[for="group-size-3"] input';
    if (await page.$eval(selector3, el => el.checked)) {
      await page.click('label[for="group-size-3"]');
      await delay(800);
      await page.click('button[type="submit"]'); // botão Filtrar
      await delay(3000);
      console.log('☑️ Apenas 2 seleções ativado');
    }
  } catch (e) {
    console.warn('⚠️ Filtro não aplicado:', e.message);
  }

  const oportunidades = await page.evaluate(() => {
    const linhas = [];
    document.querySelectorAll('.surebet_record').forEach((el) => {
      try {
        const lucro = el.querySelector('.profit')?.innerText.trim() || '';
        const tempo = el.querySelector('.age')?.innerText.trim() || '';

        const casas = el.querySelectorAll('.booker');
        const casa1 = casas[0]?.innerText.trim() || '';
        const casa2 = casas[1]?.innerText.trim() || '';

        const dataHora = el.querySelector('.time abbr')?.innerText.split('\n') || [];
        const data = dataHora[0]?.trim() || '';
        const hora = dataHora[1]?.trim() || '';

        const eventos = el.querySelectorAll('.event a');
        const evento1 = eventos[0]?.innerText.trim() || '';
        const evento2 = eventos[1]?.innerText.trim() || '';

        const descricoes = el.querySelectorAll('.event .minor');
        const descEv1 = descricoes[0]?.innerText.trim() || '';
        const descEv2 = descricoes[1]?.innerText.trim() || '';

        const mercados = el.querySelectorAll('.coeff abbr');
        const mercado1 = mercados[0]?.innerText.trim() || '';
        const mercado2 = mercados[1]?.innerText.trim() || '';

        const odds = el.querySelectorAll('.value_link');
        const odd1 = odds[0]?.innerText.trim() || '';
        const odd2 = odds[1]?.innerText.trim() || '';

        const linkCasa1 = 'https://pt.surebet.com' + (odds[0]?.getAttribute('href') || '');
        const linkCasa2 = 'https://pt.surebet.com' + (odds[1]?.getAttribute('href') || '');

        linhas.push([
          lucro, tempo, casa1, 'Futebol', casa2, 'Futebol',
          data, hora, evento1, descEv1, evento2, descEv2,
          mercado1, odd1, mercado2, odd2, linkCasa1, linkCasa2
        ]);
      } catch (err) {
        console.warn('❌ Erro bloco:', err);
      }
    });
    return linhas;
  });

  console.log(`✅ ${oportunidades.length} oportunidades extraídas`);

  for (const linha of oportunidades) {
    const [
      lucro, tempo, casa1, esporte1, casa2, esporte2,
      data, hora, evento1, descEv1, evento2, descEv2,
      mercado1, odd1, mercado2, odd2, link1, link2
    ] = linha;

    const dadosSheet = new URLSearchParams({
      lucro, tempo, casa1, esporte1, casa2, esporte2,
      data, hora, evento1, descev1: descEv1, evento2, descev2: descEv2,
      mercado1, odd1, mercado2, odd2, linkcasa1: link1, linkcasa2: link2
    });

    try {
      await fetch(`${SHEETS_URL}?${dadosSheet.toString()}`);
      console.log(`📄 Enviado ao Sheets: ${evento1} – ${evento2}`);
    } catch (e) {
      console.error('❌ Sheets erro:', e.message);
    }

    try {
      await supabase.from('arbs').insert({
        id: `${evento1}-${evento2}`.substring(0, 60),
        lucro, tempo, casa1, esporte1, casa2, esporte2,
        data, hora, evento1, descEv1, evento2, descEv2,
        mercado1, odd1, mercado2, odd2,
        linkcasa1: link1, linkcasa2: link2
      }, { returning: 'minimal' });
      console.log(`📦 Enviado ao Supabase: ${evento1} – ${evento2}`);
    } catch (e) {
      console.error('❌ Supabase erro:', e.message);
    }
  }

  await browser.close();
})();

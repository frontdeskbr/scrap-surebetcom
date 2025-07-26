import { chromium } from 'playwright';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const EMAIL = 'desenvolvimento.frontdesk@gmail.com';
const SENHA = 'Guaruja@01';
const COOKIE_PATH = './cookies.json';

const URL_LOGIN = 'https://pt.surebet.com/users/sign_in';
const URL_ARBS = 'https://pt.surebet.com/surebets';
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzaTeSftC1pLG7vN2SsnrZvEcjmzf6-8etd5fvDS_H9dFC5kdVS66kj1f6O41BEdkZxGg/exec';

const supabase = createClient(
  'https://ssrdcsrmifoexueivfls.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcmRjc3JtaWZvZXh1ZWl2ZmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgxNjM1OCwiZXhwIjoyMDY4MzkyMzU4fQ.8lK6UKsNPh3Ikll53YBbdpmGv0aWQQKuMYk9zsIiK54'
);

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log('▶️ Iniciando navegador...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // 👉 Tenta usar cookies salvos
  try {
    const cookies = JSON.parse(await fs.readFile(COOKIE_PATH, 'utf8'));
    await context.addCookies(cookies);
    console.log('🍪 Cookies carregados.');
  } catch {
    console.log('⚠️ Nenhum cookie salvo.');
  }

  const page = await context.newPage();

  console.log('🔐 Acessando página de arbitragens...');
  await page.goto(URL_ARBS, { waitUntil: 'domcontentloaded' });

  // Se redirecionar pro login, faz login e salva cookies
  if (page.url().includes('/users/sign_in')) {
    console.log('🔐 Fazendo login...');
    await page.goto(URL_LOGIN);
    await page.fill('input[name="user[email]"]', EMAIL);
    await page.fill('input[name="user[password]"]', SENHA);
    await page.click('input[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    const newCookies = await context.cookies();
    await fs.writeFile(COOKIE_PATH, JSON.stringify(newCookies, null, 2));
    console.log('✅ Login concluído e cookies salvos.');
    await page.goto(URL_ARBS, { waitUntil: 'domcontentloaded' });
  }

  await delay(3000);

  const oportunidades = await page.evaluate(() => {
    const dados = [];
    document.querySelectorAll('.surebet_record').forEach((el) => {
      try {
        const lucro = el.querySelector('.profit')?.innerText.trim() || '';
        const tempo = el.querySelector('.age')?.innerText.trim() || '';
        const casas = el.querySelectorAll('.booker');
        const casa1 = casas[0]?.innerText.trim() || '';
        const casa2 = casas[1]?.innerText.trim() || '';
        const esportes = el.querySelectorAll('.event .minor');
        const esporte1 = esportes[0]?.innerText.trim() || '';
        const esporte2 = esportes[1]?.innerText.trim() || '';
        const dataHora = el.querySelector('.time abbr')?.innerText.trim().split('\n') || [];
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

        dados.push([
          lucro, tempo, casa1, esporte1, casa2, esporte2,
          data, hora, evento1, descEv1, evento2, descEv2,
          mercado1, odd1, mercado2, odd2, linkCasa1, linkCasa2
        ]);
      } catch (e) {
        console.warn('❌ Erro bloco:', e);
      }
    });
    return dados;
  });

  console.log(`✅ Extraído: ${oportunidades.length} linhas`);

  for (const linha of oportunidades) {
    const [lucro, tempo, casa1, esporte1, casa2, esporte2, data, hora, evento1, descEv1, evento2, descEv2, mercado1, odd1, mercado2, odd2, link1, link2] = linha;

    const dadosSheet = new URLSearchParams({
      lucro, tempo, casa1, esporte1, casa2, esporte2,
      data, hora, evento1, descev1: descEv1, evento2, descev2: descEv2,
      mercado1, odd1, mercado2, odd2, linkcasa1: link1, linkcasa2: link2
    });

    try {
      await fetch(`${SHEETS_URL}?${dadosSheet.toString()}`);
      console.log(`📄 Sheets: ${evento1} – ${evento2}`);
    } catch (e) {
      console.error('❌ Erro Sheets:', e);
    }

    try {
      await supabase.from('arbs').insert({
        id: `${evento1}-${evento2}`.substring(0, 60),
        lucro, tempo, casa1, esporte1, casa2, esporte2,
        data, hora, evento1, descEv1, evento2, descEv2,
        mercado1, odd1, mercado2, odd2,
        linkcasa1: link1,
        linkcasa2: link2
      }, { returning: 'minimal' });
      console.log(`📦 Supabase: ${evento1} – ${evento2}`);
    } catch (e) {
      console.error('❌ Erro Supabase:', e);
    }
  }

  await browser.close();
})();

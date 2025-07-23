import { chromium } from 'playwright';
import fetch from 'node-fetch';

const EMAIL = 'desenvolvimento.frontdesk@gmail.com';
const SENHA = 'Guaruja@01';
const URL_LOGIN = 'https://pt.surebet.com/users/sign_in';
const URL_ARBS = 'https://pt.surebet.com/surebets';

// 🟢 Supabase
const SUPABASE_URL = 'https://ssrdcsrmifoexueivfls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcmRjc3JtaWZvZXh1ZWl2ZmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MTYzNTgsImV4cCI6MjA2ODM5MjM1OH0.m5Z0FKHB2Pow4zby3dvM-dM4Io9P9tTN4LQVfkCOCsw';

// 🟢 Google Sheets Webhook
const SHEET_WEBHOOK = 'https://script.google.com/macros/s/AKfycbxbiC-dVwkSDEKkODvHhjng_yKdarlLj5OUtpQ0EH48srq9wV5p8cEzshnRRZQuLsA2/exec';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log("▶️ Iniciando navegador...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🔑 Acessando login...");
  await page.goto(URL_LOGIN, { waitUntil: 'domcontentloaded' });

  await page.fill('input[name="user[email]"]', EMAIL);
  await page.fill('input[name="user[password]"]', SENHA);
  await page.click('input[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  console.log("✅ Login feito.");

  console.log("🌐 Indo para página de arbitragens...");
  await page.goto(URL_ARBS, { waitUntil: 'domcontentloaded' });
  await delay(3000);

  const oportunidades = await page.evaluate(() => {
    const oportunidades = [];

    document.querySelectorAll('.surebet_record').forEach((el) => {
      try {
        const lucro = el.querySelector('.profit')?.innerText.trim() || "";
        const tempo = el.querySelector('.age')?.innerText.trim() || "";

        const casas = el.querySelectorAll('.booker');
        const casa1 = casas[0]?.innerText.trim() || "";
        const casa2 = casas[1]?.innerText.trim() || "";

        const esportes = el.querySelectorAll('.event .minor');
        const esporte1 = esportes[0]?.innerText.trim() || "";
        const esporte2 = esportes[1]?.innerText.trim() || "";

        const dataHora = el.querySelector('.time abbr')?.innerText.trim().split('\n') || [];
        const data = dataHora[0]?.trim() || "";
        const hora = dataHora[1]?.trim() || "";

        const eventos = el.querySelectorAll('.event a');
        const evento1 = eventos[0]?.innerText.trim() || "";
        const evento2 = eventos[1]?.innerText.trim() || "";

        const descricoes = el.querySelectorAll('.event .minor');
        const descEv1 = descricoes[0]?.innerText.trim() || "";
        const descEv2 = descricoes[1]?.innerText.trim() || "";

        const mercados = el.querySelectorAll('.coeff abbr');
        const mercado1 = mercados[0]?.innerText.trim() || "";
        const mercado2 = mercados[1]?.innerText.trim() || "";

        const odds = el.querySelectorAll('.value_link');
        const odd1 = odds[0]?.innerText.trim() || "";
        const odd2 = odds[1]?.innerText.trim() || "";

        const linkCasa1 = "https://pt.surebet.com" + (odds[0]?.getAttribute("href") || "");
        const linkCasa2 = "https://pt.surebet.com" + (odds[1]?.getAttribute("href") || "");

        oportunidades.push({
          lucro, tempo, casa1, esporte1, casa2, esporte2,
          data, hora, evento1, descev1: descEv1, evento2, descev2: descEv2,
          mercado1, odd1, mercado2, odd2, linkcasa1: linkCasa1, linkcasa2: linkCasa2
        });
      } catch (e) {
        console.warn("❌ Erro ao processar:", e);
      }
    });

    return oportunidades;
  });

  console.log(`✅ Extraído: ${oportunidades.length} linhas`);

  for (const o of oportunidades) {
    // Enviar ao Supabase
    try {
      const resSupabase = await fetch(`${SUPABASE_URL}/rest/v1/Arbs`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(o)
      });

      if (resSupabase.ok) {
        console.log(`✅ Enviado ao Supabase: ${o.evento1} – ${o.evento2}`);
      } else {
        console.error("❌ Supabase erro:", await resSupabase.text());
      }
    } catch (e) {
      console.error("❌ Falha Supabase:", e);
    }

    // Enviar ao Google Sheets
    try {
      const url = `${SHEET_WEBHOOK}?` + new URLSearchParams(o).toString();
      const resSheet = await fetch(url);
      if (resSheet.ok) {
        console.log(`✅ Enviado ao Sheets: ${o.evento1} – ${o.evento2}`);
      } else {
        console.error("❌ Sheets erro:", await resSheet.text());
      }
    } catch (e) {
      console.error("❌ Falha Sheets:", e);
    }
  }

  await browser.close();
})();

import { chromium } from "playwright";
import fetch from "node-fetch";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://pt.surebet.com/surebets", { timeout: 60000 });

  await page.waitForSelector('.surebet_record');

  const oportunidades = await page.evaluate(() => {
    const dados = [];
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
        const descev1 = descricoes[0]?.innerText.trim() || "";
        const descev2 = descricoes[1]?.innerText.trim() || "";

        const mercados = el.querySelectorAll('.coeff abbr');
        const mercado1 = mercados[0]?.innerText.trim() || "";
        const mercado2 = mercados[1]?.innerText.trim() || "";

        const odds = el.querySelectorAll('.value_link');
        const odd1 = odds[0]?.innerText.trim() || "";
        const odd2 = odds[1]?.innerText.trim() || "";

        const linkcasa1 = "https://pt.surebet.com" + (odds[0]?.getAttribute("href") || "");
        const linkcasa2 = "https://pt.surebet.com" + (odds[1]?.getAttribute("href") || "");

        dados.push([
          lucro, tempo, casa1, esporte1, casa2, esporte2,
          data, hora, evento1, descev1, evento2, descev2,
          mercado1, odd1, mercado2, odd2, linkcasa1, linkcasa2
        ]);
      } catch (e) {
        console.warn("❌ Erro:", e);
      }
    });
    return dados;
  });

  for (const o of oportunidades) {
    const [
      lucro, tempo, casa1, esporte1, casa2, esporte2,
      data, hora, evento1, descev1, evento2, descev2,
      mercado1, odd1, mercado2, odd2, linkcasa1, linkcasa2
    ] = o;

    // ✅ Enviar para Supabase
    await fetch("https://ssrdcsrmifoexueivfls.supabase.co/rest/v1/Arbs", {
      method: "POST",
      headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcmRjc3JtaWZvZXh1ZWl2ZmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MTYzNTgsImV4cCI6MjA2ODM5MjM1OH0.m5Z0FKHB2Pow4zby3dvM-dM4Io9P9tTN4LQVfkCOCsw",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        lucro, tempo, casa1, esporte1, casa2, esporte2,
        data, hora, evento1, descev1, evento2, descev2,
        mercado1, odd1, mercado2, odd2, linkcasa1, linkcasa2
      })
    });

    // ✅ Enviar para Google Sheets
    const params = new URLSearchParams({
      lucro, tempo, casa1, esporte1, casa2, esporte2,
      data, hora, evento1, descev1, evento2, descev2,
      mercado1, odd1, mercado2, odd2, linkcasa1, linkcasa2
    });

    await fetch(`https://script.google.com/macros/s/AKfycbzaTeSftC1pLG7vN2SsnrZvEcjmzf6-8etd5fvDS_H9dFC5kdVS66kj1f6O41BEdkZxGg/exec?${params}`);
  }

  await browser.close();
})();

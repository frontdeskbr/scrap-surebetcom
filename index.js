const { chromium } = require('playwright');
const fetch = require('node-fetch');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("▶️ Acessando https://pt.surebet.com/surebets...");
  await page.goto('https://pt.surebet.com/surebets', { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForSelector('.ev-selection', { timeout: 30000 });

  const oportunidades = await page.evaluate(() => {
    const resultados = [];
    const blocos = Array.from(document.querySelectorAll('.ev-selection')).slice(0, 2);

    for (const bloco of blocos) {
      try {
        const lucro = bloco.querySelector('.highlight')?.innerText?.trim() || "";
        const tempo = bloco.querySelector('.text-muted.text-small')?.innerText?.trim() || "";

        const casas = bloco.querySelectorAll('.bookmaker-title');
        const casa1 = casas[0]?.innerText.trim() || "";
        const casa2 = casas[1]?.innerText.trim() || "";

        const esportes = bloco.querySelectorAll('.bookmaker-info .event .sport');
        const esporte1 = esportes[0]?.innerText.trim() || "";
        const esporte2 = esportes[1]?.innerText.trim() || "";

        const datas = bloco.querySelectorAll('.bookmaker-info .event .date');
        const data = datas[0]?.innerText.trim().split(' ')[0] || "";
        const hora = datas[0]?.innerText.trim().split(' ')[1] || "";

        const eventos = bloco.querySelectorAll('.bookmaker-info .event .name');
        const evento1 = eventos[0]?.innerText.trim() || "";
        const evento2 = eventos[1]?.innerText.trim() || "";

        const descricoes = bloco.querySelectorAll('.bookmaker-info .event .league');
        const descEv1 = descricoes[0]?.innerText.trim() || "";
        const descEv2 = descricoes[1]?.innerText.trim() || "";

        const mercados = bloco.querySelectorAll('.bookmaker-selection .selection');
        const mercado1 = mercados[0]?.innerText.trim() || "";
        const mercado2 = mercados[1]?.innerText.trim() || "";

        const odds = bloco.querySelectorAll('.bookmaker-selection .odd');
        const odd1 = odds[0]?.innerText.trim() || "";
        const odd2 = odds[1]?.innerText.trim() || "";

        const links = bloco.querySelectorAll('.bookmaker-logo');
        const linkCasa1 = links[0]?.getAttribute('href') || "";
        const linkCasa2 = links[1]?.getAttribute('href') || "";

        resultados.push({
          lucro, tempo, casa1, esporte1, casa2, esporte2,
          data, hora, evento1, descEv1, evento2, descEv2,
          mercado1, odd1, mercado2, odd2,
          linkCasa1, linkCasa2
        });
      } catch (e) {
        console.warn("❌ Erro ao processar bloco:", e);
      }
    }

    return resultados;
  });

  console.log(`✅ ${oportunidades.length} oportunidades coletadas.`);

  for (const item of oportunidades) {
    try {
      await fetch("https://ssrdcsrmifoexueivfls.supabase.co/rest/v1/arbs", {
        method: "POST",
        headers: {
          apikey: "SUA_API_KEY_AQUI",
          Authorization: "Bearer SUA_API_KEY_AQUI",
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(item)
      });
      console.log("📤 Enviado:", item.evento1, item.casa1, item.odd1);
    } catch (err) {
      console.error("❌ Falha ao enviar:", err);
    }
  }

  await browser.close();
})();

// utils/validateDoctor_cba.js
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

async function validateDoctorCordoba(dni, license) {
  let browser;
  try {
    // Recomendado por Cloud Run: usar /tmp y headless "new"
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      executablePath,
      headless: true,          // o 'new' si usás puppeteer >= 22
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.goto('http://181.13.90.212:8080/consulta_Matriculados.php?web=si', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await page.type('input[name="documento"]', String(dni));
    await page.type('input[name="matricula"]', String(license));

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
    ]);

    const rawText = await page.evaluate(() => document.body.innerText.trim());
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const habilitada = lines.find(line => line.toLowerCase().includes('matricula habilitada'));
    const mensajeLegal = lines.find(l => l.includes('Los datos informados'));

    const resultado = {
      valid: !!habilitada,
      estado: habilitada ? 'Habilitada' : 'No habilitada o no encontrada',
      nombre: null,
      fuente: 'cordoba',
      textoCompleto: rawText,
      mensajeLegal: mensajeLegal || null,
    };

    if (habilitada) {
      const idx = lines.indexOf(habilitada);
      if (lines[idx + 1]) {
        resultado.nombre = lines[idx + 1].replace(/^Dr\.?\s+|^Dra\.?\s+/i, '').trim();
      }
    }

    return resultado;
  } catch (error) {
    console.error('❌ Error al validar con Colegio Médico de Córdoba:', error?.message || error);
    return { valid: false, error: error?.message || String(error), fuente: 'cordoba' };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = validateDoctorCordoba;

// utils/validateDoctor_cba.js
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

async function validateDoctorCordoba(dni, license) {
  let browser;
  try {
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      executablePath,
      headless: chromium.headless,         
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-zygote',
        '--single-process'
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

    return {
      valid: !!habilitada,
      estado: habilitada ? 'Habilitada' : 'No habilitada o no encontrada',
      fuente: 'cordoba',
      textoCompleto: rawText
    };
  } catch (error) {
    console.error('❌ Error al validar con Colegio Médico de Córdoba:', error?.message || error);
    return { valid: false, error: error?.message || String(error), fuente: 'cordoba' };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = validateDoctorCordoba;

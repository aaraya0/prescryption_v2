const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const captureGwtPayload = async (dniOrMatricula) => {
    console.log(`🔍 Buscando profesional con DNI/Matrícula: ${dniOrMatricula}`);

    const browser = await puppeteer.launch({ 
        headless: false,
        userDataDir: "C:/temp/chrome-profile",
        args: ['--ignore-certificate-errors', '--disable-blink-features=AutomationControlled'],
        ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', request => {
        if (
            request.url().includes('/sisa/sisa/service/list') &&
            request.method() === 'POST'
        ) {
            const postData = request.postData();
            console.log("✅ Payload GWT capturado:");
            console.log(postData);
            fs.writeFileSync('payload.txt', postData);
            console.log("📁 Payload guardado en payload.txt");
        }
        request.continue();
    });

    // Configurar User-Agent y evitar detección
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-ES,es;q=0.9' });
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Cargar cookies si las tenés
    try {
        const cookies = require('./cookies.json');
        console.log("🍪 Cookies cargadas desde JSON:");
        cookies.forEach(cookie => {
            console.log(`➡️ ${cookie.name}: ${cookie.value} (${cookie.domain}${cookie.path})`);
        });
        await page.setCookie(...cookies);
        console.log("✅ Cookies inyectadas antes de navegar.");
    } catch (err) {
        console.warn("⚠️ No se encontraron cookies.json. Continuando sin cookies...");
    }

    await page.goto("https://sisa.msal.gov.ar/sisa/#sisa", { waitUntil: 'networkidle2', timeout: 60000 });
    console.log("✅ Página cargada con User-Agent modificado.");

    try {
        await page.waitForSelector("div.panel-body", { timeout: 60000 });

        const buttons = await page.$$("div.panel-body");
        for (const button of buttons) {
            const text = await page.evaluate(el => el.innerText.trim(), button);
            if (text.includes("Buscador de Establecimientos y Profesionales")) {
                await button.click();
                console.log("✅ Accedió al buscador de establecimientos y profesionales.");
                break;
            }
        }

        await new Promise(resolve => setTimeout(resolve, 5000));

        await page.waitForSelector("div.botonera_texto", { timeout: 20000 });
        const tabs = await page.$$("div.botonera_texto");
        for (const tab of tabs) {
            const text = await page.evaluate(el => el.innerText.trim(), tab);
            if (text.includes("REFEPS")) {
                await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), tab);
                await new Promise(resolve => setTimeout(resolve, 1000));
                await page.evaluate(el => el.click(), tab);
                console.log("✅ Hizo clic en la pestaña REFEPS correctamente.");
                break;
            }
        }

        await page.waitForSelector('input[placeholder="Número de documento "]', { visible: true, timeout: 20000 });
        console.log("✅ Confirmado: está en la pestaña REFEPS.");

        const input = await page.$('input[placeholder="Número de documento "]');
        if (!input) throw new Error("❌ No se encontró el campo de entrada de documento.");
        await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), input);
        await new Promise(resolve => setTimeout(resolve, 500));
        await input.click({ delay: 100 });
        await input.focus();
        await input.evaluate(el => el.value = "");
        await page.keyboard.type(dniOrMatricula, { delay: 100 });

        await page.waitForSelector('div.boton.boton_general', { visible: true, timeout: 10000 });
        await page.evaluate(() => {
            document.querySelector('div.boton.boton_general').click();
        });
        console.log("✅ Hizo clic en el botón de búsqueda.");

        // Esperar a que cargue la tabla
        await page.waitForSelector('.resultTable tbody tr', { timeout: 25000 });

        console.log("🎯 Finalizado. Cerrando navegador...");
        await browser.close();
    } catch (error) {
        console.error(`❌ Error en el scraping: ${error.message}`);
        await browser.close();
    }
};

if (require.main === module) {
    (async () => {
        const dniOrMatricula = process.argv[2] || "41758877";
        await captureGwtPayload(dniOrMatricula);
    })();
}

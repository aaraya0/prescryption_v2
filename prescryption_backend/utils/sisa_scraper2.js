const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const scrapeSISAValidation = async (dniOrMatricula) => {
    console.log(`🔍 Buscando profesional con DNI/Matrícula: ${dniOrMatricula}`);

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: "C:/temp/chrome-profile",
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Ruta a Chrome
        args: ['--ignore-certificate-errors', '--disable-blink-features=AutomationControlled'],
        ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36");

    try {
        await page.goto("https://sisa.msal.gov.ar/sisa/#sisa", {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        console.log("✅ Página cargada con sesión persistente.");

        await page.waitForSelector("div.panel-body", { timeout: 60000 });

        const botones = await page.$$("div.panel-body");
        for (const boton of botones) {
            const text = await page.evaluate(el => el.innerText.trim(), boton);
            if (text.includes("Buscador de Establecimientos y Profesionales")) {
                await boton.click();
                console.log("✅ Entró al buscador de establecimientos y profesionales.");
                break;
            }
        }

        await page.waitForSelector("div.botonera_texto", { timeout: 20000 });
        const tabs = await page.$$("div.botonera_texto");
        for (const tab of tabs) {
            const text = await page.evaluate(el => el.innerText.trim(), tab);
            if (text.includes("REFEPS")) {
                await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), tab);
                await new Promise(resolve => setTimeout(resolve, 1000));
                await page.evaluate(el => el.click(), tab);
                console.log("✅ Entró en la pestaña REFEPS.");
                break;
            }
        }

        await page.waitForSelector('input[placeholder="Número de documento "]', { visible: true, timeout: 20000 });
        const input = await page.$('input[placeholder="Número de documento "]');
        await input.click({ delay: 100 });
        await input.focus();
        await input.evaluate(el => el.value = "");
        await page.keyboard.type(dniOrMatricula, { delay: 100 });

        await page.waitForSelector('div.boton.boton_general', { visible: true, timeout: 10000 });
        await page.evaluate(() => {
            document.querySelector('div.boton.boton_general').click();
        });
        console.log("✅ Hizo clic en buscar.");

        await page.waitForSelector('.resultTable tbody tr', { timeout: 25000 });

        const result = await page.evaluate(() => {
            const row = document.querySelector('.resultTable tbody tr');
            if (!row) return null;
            const columns = row.querySelectorAll('td');
            return {
                name: columns[0]?.innerText.trim() || 'N/A',
                profession: columns[1]?.innerText.trim() || 'N/A',
                status: columns[2]?.innerText.trim() || 'N/A'
            };
        });

        console.log("✅ Resultado:", result);
        await browser.close();
        return result;

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        await page.screenshot({ path: 'sisa_error.png' });
        console.log("📸 Captura guardada como 'sisa_error.png'");
        await browser.close();
        return null;
    }
};

if (require.main === module) {
    (async () => {
        const dniOrMatricula = process.argv[2] || "41758877";
        const result = await scrapeSISAValidation(dniOrMatricula);
        console.log("📌 Datos finales:", result);
    })();
}

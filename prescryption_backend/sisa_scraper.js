const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const scrapeSISAValidation = async (dniOrMatricula) => {
    console.log(`🔍 Buscando profesional con DNI/Matrícula: ${dniOrMatricula}`);

    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--ignore-certificate-errors', '--disable-blink-features=AutomationControlled'],
        ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    // Configurar User-Agent y evitar detección
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-ES,es;q=0.9' });
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Ir a la página
    await page.goto("https://sisa.msal.gov.ar/sisa/#sisa", { waitUntil: 'networkidle2', timeout: 60000 });
    console.log("✅ Página cargada con User-Agent modificado.");

    try {
        // Esperar y hacer clic en el botón correcto en el panel de búsqueda
        await page.waitForSelector("div.panel-body", { timeout: 60000 });
        
        const buttons = await page.$$("div.panel-body");
        let found = false;
        
        for (const button of buttons) {
            const text = await page.evaluate(el => el.innerText.trim(), button);
            if (text.includes("Buscador de Establecimientos y Profesionales")) {
                await button.click();
                found = true;
                console.log("✅ Accedió al buscador de establecimientos y profesionales.");
                break;
            }
        }

        if (!found) throw new Error("❌ No se encontró el botón de búsqueda.");

        // Esperar a que cargue la siguiente pantalla
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Buscar y hacer clic en la pestaña correcta "REFEPS"
        await page.waitForSelector("div.botonera_texto", { timeout: 20000 });
        
        const tabs = await page.$$("div.botonera_texto");
        let refepsTab = null;
        
        for (const tab of tabs) {
            const text = await page.evaluate(el => el.innerText.trim(), tab);
            if (text.includes("REFEPS")) {
                refepsTab = tab;
                break;
            }
        }
        
        if (refepsTab) {
            await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), refepsTab);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.evaluate(el => el.click(), refepsTab);
            console.log("✅ Hizo clic en la pestaña REFEPS correctamente.");
        } else {
            throw new Error("❌ No se encontró la pestaña REFEPS.");
        }

        // Esperar a que el formulario de búsqueda esté disponible usando el placeholder con espacio al final
        await page.waitForSelector('input[placeholder="Número de documento "]', { visible: true, timeout: 20000 });
        console.log("✅ Confirmado: está en la pestaña REFEPS.");
        
        // Seleccionar el input y escribir el DNI
        const input = await page.$('input[placeholder="Número de documento "]');
        if (!input) throw new Error("❌ No se encontró el campo de entrada de documento.");
        await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), input);
        await new Promise(resolve => setTimeout(resolve, 500));
        await input.click({ delay: 100 });
        await input.focus();
        await input.evaluate(el => el.value = "");
        await page.keyboard.type(dniOrMatricula, { delay: 100 });
        
        // Esperar a que el botón de búsqueda sea interactivo antes de hacer clic
        await page.waitForSelector('div.boton.boton_general', { visible: true, timeout: 10000 });
        await page.evaluate(() => {
            document.querySelector('div.boton.boton_general').click();
        });
        console.log("✅ Hizo clic en el botón de búsqueda.");

        // Esperar a que se carguen los resultados
        await page.waitForSelector('.resultTable tbody tr', { timeout: 25000 });
        
        // Extraer los datos de la primera fila de resultados
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
        console.error(`❌ Error en el scraping: ${error.message}`);
        await browser.close();
        return null;
    }
};

// Ejecutar el scraper directamente si se ejecuta este archivo
if (require.main === module) {
    (async () => {
        const dniOrMatricula = process.argv[2] || "41758877";
        const result = await scrapeSISAValidation(dniOrMatricula);
        console.log("📌 Datos obtenidos:", result);
    })();
}
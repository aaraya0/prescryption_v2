const puppeteer = require('puppeteer');

async function validateDoctorCordoba(dni, license) {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.goto('http://181.13.90.212:8080/consulta_Matriculados.php?web=si', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Completa DNI y Matrícula
        await page.type('input[name="documento"]', dni.toString());
        await page.type('input[name="matricula"]', license.toString());

        // Clic en "Consultar"
        await Promise.all([
            page.click('input[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);

        // Captura y limpia el contenido de la respuesta
        const rawText = await page.evaluate(() => document.body.innerText.trim());
        await browser.close();

        const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
        const habilitada = lines.find(line => line.toLowerCase().includes('matricula habilitada'));
        const mensajeLegal = lines.find(l => l.includes('Los datos informados'));

        const resultado = {
            valid: !!habilitada,
            estado: habilitada ? 'Habilitada' : 'No habilitada o no encontrada',
            nombre: null,
            fuente: 'cordoba',
            textoCompleto: rawText,
            mensajeLegal: mensajeLegal || null
        };

        // Extraer nombre si existe una línea siguiente
        if (habilitada) {
            const idx = lines.indexOf(habilitada);
            if (lines[idx + 1]) {
                resultado.nombre = lines[idx + 1].replace(/^Dr\.?\s+|^Dra\.?\s+/i, '').trim();
            }
        }

        return resultado;
    } catch (error) {
        console.error("❌ Error al validar con Colegio Médico de Córdoba:", error.message);
        return {
            valid: false,
            error: error.message,
            fuente: 'cordoba'
        };
    }
}

module.exports = validateDoctorCordoba;

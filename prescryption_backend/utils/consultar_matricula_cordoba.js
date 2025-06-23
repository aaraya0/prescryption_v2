const puppeteer = require('puppeteer');

const consultarMatricula = async (dni) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://181.13.90.212:8080/consulta_Matriculados.php?web=si', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    console.log(`🔍 Consultando DNI ${dni} en Colegio Médico de Córdoba...`);

    // Completa el campo "documento"
    await page.type('input[name="documento"]', dni.toString());

    // Clic en Consultar
    await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Captura y limpia el texto del body
    const rawText = await page.evaluate(() => document.body.innerText.trim());
    await browser.close();

    // Procesar el texto para obtener los campos
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const jsonResult = {
        estado: null,
        nombre: null,
        mensajeLegal: null,
        textoCompleto: rawText
    };

    // Buscar si hay matrícula habilitada
    const habilitada = lines.find(line => line.toLowerCase().includes('matricula habilitada'));
    if (habilitada) {
        jsonResult.estado = 'Habilitada';
        const idx = lines.indexOf(habilitada);
    if (lines[idx + 1]) {
        jsonResult.nombre = lines[idx + 1].replace(/^Dr\.?\s+|^Dra\.?\s+/i, '').trim();
    }

    } else {
        jsonResult.estado = 'No habilitada o no encontrada';
    }

    // Buscar mensaje legal
    const mensaje = lines.find(l => l.includes('Los datos informados'));
    if (mensaje) {
        jsonResult.mensajeLegal = mensaje;
    }

    return jsonResult;
};

// Ejecutar si se llama directamente
if (require.main === module) {
    const dni = process.argv[2] || '41758877';
    consultarMatricula(dni).then(res => {
        console.log("📋 Resultado estructurado:");
        console.log(JSON.stringify(res, null, 2));
    });
}

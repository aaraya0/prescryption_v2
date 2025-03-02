const puppeteer = require('puppeteer');

exports.scrapeMedicationData = async (drugName) => {
    console.log(`🔍 Scraping data for: ${drugName}`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://www.argentina.gob.ar/precios-de-medicamentos");

    try {
        // ✅ Esperar a que la página cargue completamente
        await new Promise(r => setTimeout(r, 3000));

        // ✅ Buscar todos los iframes
        const frames = await page.frames();
        let searchInput = null;
        let targetFrame = null;

        console.log(`🧐 Se encontraron ${frames.length} iframes. Buscando el correcto...`);

        // ✅ Iterar sobre los iframes hasta encontrar el input de búsqueda
        for (let frame of frames) {
            searchInput = await frame.$("#searchInput");
            if (searchInput) {
                targetFrame = frame;
                console.log("✅ Input de búsqueda encontrado.");
                break;
            }
        }

        // ✅ Si no se encontró el input, lanzar un error
        if (!targetFrame) {
            throw new Error("❌ No se encontró el input de búsqueda en ningún iframe.");
        }

        // ✅ Escribir en el campo de búsqueda
        await searchInput.type(drugName);
        await searchInput.press("Enter");

        console.log("✅ Se ingresó el medicamento en la búsqueda.");

        // ✅ Esperar a que los resultados se carguen
        await new Promise(r => setTimeout(r, 5000)); // Simula waitForTimeout()

        // ✅ Extraer los primeros 30 resultados
        const rows = await targetFrame.$$("table tbody tr");
        const medications = [];

        console.log(`📌 Se encontraron ${rows.length} filas en la tabla.`);

        for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const columns = await rows[i].$$("td");
            if (columns.length >= 3) {
                const name = await columns[0].evaluate(el => el.innerText.trim());
                const price = await columns[1].evaluate(el => el.innerText.trim());
                const pamiPrice = await columns[2].evaluate(el => el.innerText.trim());

                let details = {};

                // ✅ Buscar y hacer clic en el botón "Ver más"
                try {
                    const verMasButton = await rows[i].$("button");
                    if (verMasButton) {
                        await verMasButton.click();
                        console.log(`🔍 Obteniendo información adicional de: ${name}`);

                        await new Promise(r => setTimeout(r, 2000)); // Esperar a que cargue el modal

                        // ✅ Extraer información del modal
                        const modal = await targetFrame.$(".modal-body");
                        if (modal) {
                            const detailsText = await modal.evaluate(el => el.innerText);
                            details = parseDetails(detailsText);
                        }

                        // ✅ Cerrar el modal
                        const closeButton = await targetFrame.$(".close");
                        if (closeButton) {
                            await closeButton.click();
                        }
                    }
                } catch (error) {
                    console.error(`⚠️ No se pudo obtener detalles de ${name}: ${error.message}`);
                }

                medications.push({
                    name,
                    price,
                    pamiPrice,
                    details
                });
            }
        }

        console.log(`✅ Scraped ${medications.length} medications.`);
        await browser.close();
        return medications;

    } catch (error) {
        console.error(`❌ Scraping error: ${error.message}`);
        await browser.close();
        return [];
    }
};

// ✅ Función para parsear los detalles del modal
function parseDetails(detailsText) {
    const details = {};
    const lines = detailsText.split("\n");

    lines.forEach(line => {
        if (line.includes("Laboratorio:")) details.laboratory = line.split(":")[1].trim();
        if (line.includes("Componente Activo:")) details.activeComponent = line.split(":")[1].trim();
        if (line.includes("Presentación:")) details.presentation = line.split(":")[1].trim();
        if (line.includes("Vía:")) details.route = line.split(":")[1].trim();
        if (line.includes("Acción:")) details.action = line.split(":")[1].trim();
        if (line.includes("Origen:")) details.origin = line.split(":")[1].trim();
        if (line.includes("Tipo de Venta:")) details.saleType = line.split(":")[1].trim();
        if (line.includes("Descuento PAMI:")) details.discountPami = line.split(":")[1].trim();
        if (line.includes("Precio Unitario:")) details.unitPrice = line.split(":")[1].trim();
    });

    return details;
}

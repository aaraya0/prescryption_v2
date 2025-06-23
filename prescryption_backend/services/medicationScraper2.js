const puppeteer = require('puppeteer');

exports.scrapeMedicationData = async (drugName) => {
    console.log(`🔍 Scraping data for: ${drugName}`);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://www.argentina.gob.ar/precios-de-medicamentos");

    try {
        await new Promise(r => setTimeout(r, 3000));

        const frames = await page.frames();
        let searchInput = null;
        let targetFrame = null;

        console.log(`🧐 Se encontraron ${frames.length} iframes. Buscando el correcto...`);

        for (let frame of frames) {
            searchInput = await frame.$("#searchInput");
            if (searchInput) {
                targetFrame = frame;
                console.log("✅ Input de búsqueda encontrado.");
                break;
            }
        }

        if (!targetFrame) {
            throw new Error("❌ No se encontró el input de búsqueda en ningún iframe.");
        }

        await searchInput.type(drugName);
        await searchInput.press("Enter");

        console.log("✅ Se ingresó el medicamento en la búsqueda.");

        await new Promise(r => setTimeout(r, 5000));

        const rows = await targetFrame.$$("table tbody tr");
        const medications = [];

        console.log(`📌 Se encontraron ${rows.length} filas en la tabla.`);

        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const columns = await rows[i].$$("td");
            if (columns.length >= 3) {
                const name = await columns[0].evaluate(el => el.innerText.trim());
                let priceText = await columns[1].evaluate(el => el.innerText.trim());
                let pamiPriceText = await columns[2].evaluate(el => el.innerText.trim());

                try {
                    let details = {};  
                    let detailsText = "";  

                    const verMasButton = await rows[i].$("button");
                    if (verMasButton) {
                        for (let attempt = 0; attempt < 2; attempt++) {  // Intentamos dos veces
                            await verMasButton.click();
                            console.log(`🔍 Intento ${attempt + 1} de obtener información de: ${name}`);

                            await new Promise(r => setTimeout(r, 3000));

                            try {
                                await page.waitForSelector(".modal-body", { visible: true, timeout: 3000 });
                                const modal = await targetFrame.$(".modal-body");
                                if (modal) {
                                    detailsText = await modal.evaluate(el => el.innerText);
                                    details = parseDetails(detailsText);
                                    break; // Salimos del bucle si logramos obtener los detalles
                                }
                            } catch (error) {
                                console.warn(`⚠️ No se pudo extraer detalles en el intento ${attempt + 1} para ${name}`);
                            }
                        }

                        const closeButton = await targetFrame.$(".close");
                        if (closeButton) {
                            await closeButton.click();
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }

                    if (!detailsText) {
                        console.warn(`⚠️ No se encontraron detalles para ${name}`);
                    }

                    const price = formatPrice(priceText);
                    const pamiPrice = parsePamiPrice(pamiPriceText, details.discountPami);

                    medications.push({
                        brandName: name,
                        genericName: drugName,
                        activeComponentsList: details.activeComponent ? details.activeComponent.split("+").map(c => c.trim().replace(/\.$/, "")) : [],
                        price,
                        pamiPrice,
                        details
                    });

                    console.log(`📝 Agregado: ${name} | Precio: ${price} | PAMI: ${pamiPrice}`);
                } catch (error) {
                    console.error(`⚠️ Error procesando ${name}: ${error.message}`);
                }
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
        if (line.includes("Descuento PAMI:")) details.discountPami = extractDiscountPercentage(line.split(":")[1].trim());
        if (line.includes("Precio Unitario:")) details.unitPrice = formatPrice(line.split(":")[1].trim());
    });

    return details;
}

function formatPrice(priceText) {
    if (!priceText || priceText.trim() === "") return 0;

    let cleanedText = priceText.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(cleanedText) || 0;
}

function parsePamiPrice(pamiPriceText, discountPami) {
    if (!pamiPriceText || pamiPriceText.trim() === "" || pamiPriceText.includes("Sin descuento")) {
        return 0;
    }

    return formatPrice(pamiPriceText);
}

function extractDiscountPercentage(text) {
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
}

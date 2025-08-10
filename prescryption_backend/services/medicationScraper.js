const axios = require("axios");

exports.scrapeMedicationData = async (drugName) => {
    console.log(`🔍 Consultando API oficial para: ${drugName}`);
    try {
        const response = await axios.post("https://cnpm.msal.gov.ar/api/vademecum", {
            searchdata: drugName
        }, {
            headers: {
                "Content-Type": "application/json",
                "Origin": "https://www.argentina.gob.ar",
                "Referer": "https://www.argentina.gob.ar/"
            }
        });

        const results = response.data;

        console.log(`✅ Se obtuvieron ${results.length} resultados.`);

        return results.map(item => ({
            brandName: item.NOMBRE,
            genericName: drugName,
            activeComponentsList: item.DROGA ? item.DROGA.split("+").map(c => c.trim()) : [],
            price: item.PRECIO || 0,
            pamiPrice: item.PRECIOPAMI || estimatePami(item.PRECIO, item.D_PAMI),
            details: {
                presentation: item.PRESENTACION,
                laboratory: item.LABORATORIO,
                route: item.VIA,
                action: item.ACCION,
                saleType: item.TIPO_DE_VENTA,
                origin: item.IMPORTADO,
                discountPami: extractDiscount(item.D_PAMI),
                unitPrice: item.PRECIO
            }
        }));
    } catch (error) {
        console.error("❌ Error consultando API del Ministerio:", error.message);
        return [];
    }
};

function extractDiscount(dPami) {
    const match = dPami?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
}

function estimatePami(price, dPami) {
    const discount = extractDiscount(dPami);
    return discount > 0 ? Math.round(price * (1 - discount / 100)) : 0;
}

if (require.main === module) {
    const input = process.argv.slice(2).join(" ");

    if (!input) {
        console.error("❌ Debes ingresar el nombre de un medicamento. Ejemplo:");
        console.error("   node medicationScraper.js ibuprofeno");
        process.exit(1);
    }

    (async () => {
        const data = await exports.scrapeMedicationData(input);
        console.log(JSON.stringify(data, null, 2));
    })();
}


const fs = require('fs');
const PDFParser = require("pdf2json");

async function test() {
    console.log("Testing pdf2json...");
    const dummyBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /MediaBox [0 0 612 792] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");

    try {
        const pdfParser = new PDFParser(null, 1);
        console.log("Parser created");

        const text = await new Promise((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", (errData) => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", (pdfData) => {
                console.log("Ready event received");
                const raw = pdfParser.getRawTextContent();
                resolve(raw);
            });

            console.log("Parsing buffer...");
            pdfParser.parseBuffer(dummyBuffer);
        });

        console.log("Text extracted:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();

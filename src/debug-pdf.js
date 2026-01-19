```javascript
const fs = require('fs');
const path = require('path');
const pdfLib = require('pdf-parse');
// Check if it's a default export
const pdf = pdfLib.default || pdfLib;

console.log("Type of pdf:", typeof pdf);
console.log("Keys:", Object.keys(pdf));

async function testPdfParse() {
    console.log("Starting PDF parse test...");
    
    // Minimal PDF
    const dummyBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /MediaBox [0 0 612 792] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF");
    } catch(e) { console.log("Fail 1", e.message); }

    try {
        console.log("Attempt 2: pdf.PDFParse(buffer)");
        // @ts-ignore
        const data = await pdf.PDFParse(dummyBuffer);
        console.log("Success 2!", data.text);
    } catch(e) { console.log("Fail 2 (static)", e.message); }

     try {
        console.log("Attempt 3: new pdf.PDFParse(buffer)");
        // @ts-ignore
        const instance = new pdf.PDFParse(dummyBuffer);
         console.log("Success 3!", instance);
    } catch(e) { console.log("Fail 3 (constructor)", e.message); }
}

testPdfParse();

    } catch (e) {
        console.error("Parse failed:", e);
    }
}

testPdfParse();

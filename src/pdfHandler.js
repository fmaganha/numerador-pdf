const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const sharp = require('sharp');

async function processarPDF(pdfPath, numeroInicial, numeroProcesso, anoProcesso, incluirRubrica, rubricaPath) {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let rubricaImage;
    if (incluirRubrica && rubricaPath) {
        rubricaImage = await sharp(rubricaPath).resize(100, 100).toBuffer();
        rubricaImage = await pdfDoc.embedPng(rubricaImage);
    }

    let numeroFolha = parseInt(numeroInicial);

    for (let i = 0; i < pages.length; i++) {
        if (i % 2 === 0) { // Páginas ímpares (índice começa em 0)
            const page = pages[i];
            const { width, height } = page.getSize();

            // Desenha o retângulo branco no canto superior direito
            page.drawRectangle({
                x: width - 200,
                y: height - 50,
                width: 180,
                height: 40,
                color: rgb(1, 1, 1),
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            // Insere as informações
            page.drawText(`PA: ${numeroProcesso}/${anoProcesso}`, {
                x: width - 190,
                y: height - 30,
                size: 10,
                font,
                color: rgb(0, 0, 0),
            });

            page.drawText(`fls. ${numeroFolha}`, {
                x: width - 190,
                y: height - 45,
                size: 10,
                font,
                color: rgb(0, 0, 0),
            });

            if (rubricaImage) {
                page.drawImage(rubricaImage, {
                    x: width - 100,
                    y: height - 90,
                    width: 50,
                    height: 50,
                });
            }

            numeroFolha++;
        }
    }

    const pdfBytesProcessado = await pdfDoc.save();
    const outputPath = `output_${Date.now()}.pdf`;
    fs.writeFileSync(outputPath, pdfBytesProcessado);

    return outputPath;
}

module.exports = { processarPDF };
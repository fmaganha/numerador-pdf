const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const sharp = require('sharp');

// Configurações globais
const RECT_MARGIN = 5;
const RUBRICA_SCALE = 0.6;
const TEXT_SPACING = 10;
const RUBRICA_SPACING = 5;
const MARGEM_RUBRICA_TEXTO = 5; // Margem entre o texto e a rubrica

/**
 * Processa a rubrica, limitando a altura a um valor máximo e mantendo a proporção.
 */
async function processarRubrica(rubricaPath, rubricaHeight) {
  try {
    const rubricaBuffer = await sharp(rubricaPath)
      .resize(null, parseInt(rubricaHeight), {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();
    return rubricaBuffer;
  } catch (error) {
    console.error('Erro ao processar a rubrica:', error);
    throw new Error('Erro ao processar a rubrica: ' + error.message);
  }
}

// Função para desenhar o texto e a rubrica no PDF
async function processarPDF(pdfPath, numeroInicial, numeroProcesso, anoProcesso, incluirRubrica, rubricaPath, fontSize, rubricaHeight) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let rubricaImage;
    let rubricaWidth, rubricaHeightFinal;

    if (incluirRubrica && rubricaPath) {
      const rubricaBuffer = await processarRubrica(rubricaPath, rubricaHeight);
      const rubricaImageEmbed = await pdfDoc.embedPng(rubricaBuffer);
      rubricaImage = rubricaImageEmbed;
      rubricaWidth = rubricaImageEmbed.width * RUBRICA_SCALE;
      rubricaHeightFinal = rubricaImageEmbed.height * RUBRICA_SCALE;
    }

    let numeroFolha = parseInt(numeroInicial);

    for (let i = 0; i < pages.length; i++) {
      if (i % 2 === 0) {
        const page = pages[i];
        const { width, height } = page.getSize();

        const paText = `PA: ${numeroProcesso}/${anoProcesso}`;
        const flsText = `fls. ${numeroFolha}`;
        const paTextWidth = font.widthOfTextAtSize(paText, parseInt(fontSize));
        const flsTextWidth = font.widthOfTextAtSize(flsText, parseInt(fontSize));

        const rectWidth = Math.max(paTextWidth, flsTextWidth, rubricaWidth || 0) + RECT_MARGIN * 2;
        const textHeight = 15;
        const rectHeight = textHeight + (rubricaImage ? rubricaHeightFinal + RUBRICA_SPACING : 0) + (rubricaImage ? RECT_MARGIN : RECT_MARGIN * 2);

        const rectX = width - rectWidth - RECT_MARGIN;
        const rectY = height - rectHeight - RECT_MARGIN;

        page.drawRectangle({
          x: rectX,
          y: rectY,
          width: rectWidth,
          height: rectHeight,
          color: rgb(1, 1, 1),
          borderColor: rgb(1, 1, 1),
          borderWidth: 0,
        });

        page.drawText(paText, {
          x: rectX + rectWidth - paTextWidth - RECT_MARGIN,
          y: rectY + rectHeight - 10,
          size: parseInt(fontSize),
          font,
          color: rgb(0, 0, 0),
        });

        page.drawText(flsText, {
          x: rectX + rectWidth - flsTextWidth - RECT_MARGIN,
          y: rectY + rectHeight - 10 - TEXT_SPACING,
          size: parseInt(fontSize),
          font,
          color: rgb(0, 0, 0),
        });

        if (rubricaImage) {
          page.drawImage(rubricaImage, {
            x: rectX + rectWidth - rubricaWidth - RECT_MARGIN,
            y: rectY + RECT_MARGIN - MARGEM_RUBRICA_TEXTO,
            width: rubricaWidth,
            height: rubricaHeightFinal,
          });
        }

        numeroFolha++;
      }
    }

    const outputPath = `output_${Date.now()}.pdf`;
    const pdfBytesProcessado = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytesProcessado);

    return outputPath;
  } catch (error) {
    console.error('Erro ao processar o PDF:', error);
    throw new Error('Erro ao processar o PDF: ' + error.message);
  }
}

module.exports = { processarPDF };
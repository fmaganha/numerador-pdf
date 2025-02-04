const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const sharp = require('sharp');

// Configurações globais
const RECT_MARGIN = 5;
const RUBRICA_SCALE = 0.6;
const TEXT_SPACING = 10;
const RUBRICA_SPACING = 5;
const MARGEM_RUBRICA_TEXTO = 2;

// Função para processar a rubrica
async function processarRubrica(rubricaPath, rubricaHeight) {
  try {
    console.log('Processando rubrica...');
    const rubricaBuffer = await sharp(rubricaPath)
      .resize(null, parseInt(rubricaHeight), { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    console.log('Rubrica processada com sucesso.');
    return rubricaBuffer;
  } catch (error) {
    console.error('Erro ao processar a rubrica:', error.message);
    throw new Error('Erro ao processar a rubrica: ' + error.message);
  }
}

// Função para desenhar texto no PDF
function desenharTexto(page, font, text, x, y, fontSize, color = rgb(0, 0, 0)) {
  page.drawText(text, { x, y, size: parseInt(fontSize), font, color });
}

// Função para desenhar a rubrica no PDF
function desenharRubrica(page, rubricaImage, x, y, width, height) {
  page.drawImage(rubricaImage, { x, y, width, height });
}

// Função principal para processar o PDF
async function processarPDF(pdfPath, numeroInicial, numeroProcesso, anoProcesso, incluirRubrica, rubricaPath, fontSize, rubricaHeight) {
  try {
    console.log('Carregando PDF...');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let rubricaImage, rubricaWidth, rubricaHeightFinal;
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

        desenharTexto(page, font, paText, rectX + rectWidth - paTextWidth - RECT_MARGIN, rectY + rectHeight - 10, fontSize);
        desenharTexto(page, font, flsText, rectX + rectWidth - flsTextWidth - RECT_MARGIN, rectY + rectHeight - 10 - TEXT_SPACING, fontSize);

        if (rubricaImage) {
          desenharRubrica(page, rubricaImage, rectX + rectWidth - rubricaWidth - RECT_MARGIN, rectY + RECT_MARGIN - MARGEM_RUBRICA_TEXTO, rubricaWidth, rubricaHeightFinal);
        }

        numeroFolha++;
      }
    }

    console.log('Salvando PDF processado...');
    const outputPath = `output_${Date.now()}.pdf`;
    const pdfBytesProcessado = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytesProcessado);
    console.log('PDF salvo com sucesso:', outputPath);

    return outputPath;
  } catch (error) {
    console.error('Erro ao processar o PDF:', error.message);
    throw new Error('Erro ao processar o PDF: ' + error.message);
  }
}

module.exports = { processarPDF };
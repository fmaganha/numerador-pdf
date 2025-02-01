const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const sharp = require('sharp');

// Configurações globais
const FONT_SIZE = 8; // Tamanho da fonte
const RECT_MARGIN = 5; // Margem do retângulo
const RUBRICA_MAX_HEIGHT = 17; // Altura máxima da rubrica
const RUBRICA_SCALE = 0.6; // Escala da rubrica (60% do tamanho original)
const TEXT_SPACING = 10; // Espaçamento entre as linhas de texto
const RUBRICA_SPACING = 5; // Espaço entre o texto e a rubrica

/**
 * Processa a rubrica, limitando a altura a 20px e mantendo a proporção.
 */
async function processarRubrica(rubricaPath) {
    try {
        const rubricaBuffer = await sharp(rubricaPath)
            .resize(null, RUBRICA_MAX_HEIGHT, { // Limita a altura a 20px
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

/**
 * Desenha o texto no PDF, alinhado à direita.
 */
function desenharTexto(page, text, x, y, font, fontSize, color) {
    page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color,
    });
}

/**
 * Desenha o retângulo no PDF.
 */
function desenharRetangulo(page, x, y, width, height, color) {
    page.drawRectangle({
        x,
        y,
        width,
        height,
        color,
        borderColor: color,
        borderWidth: 0,
    });
}

/**
 * Processa o PDF, adicionando o texto e a rubrica nas páginas ímpares.
 */
async function processarPDF(pdfPath, numeroInicial, numeroProcesso, anoProcesso, incluirRubrica, rubricaPath) {
    try {
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let rubricaImage;
        let rubricaWidth, rubricaHeight;

        if (incluirRubrica && rubricaPath) {
            const rubricaBuffer = await processarRubrica(rubricaPath);
            const rubricaImageEmbed = await pdfDoc.embedPng(rubricaBuffer);
            rubricaImage = rubricaImageEmbed;
            rubricaWidth = rubricaImageEmbed.width * RUBRICA_SCALE;
            rubricaHeight = rubricaImageEmbed.height * RUBRICA_SCALE;
        }

        let numeroFolha = parseInt(numeroInicial);

        for (let i = 0; i < pages.length; i++) {
            if (i % 2 === 0) { // Páginas ímpares
                const page = pages[i];
                const { width, height } = page.getSize();

                const paText = `PA: ${numeroProcesso}/${anoProcesso}`;
                const flsText = `fls. ${numeroFolha}`;
                const paTextWidth = font.widthOfTextAtSize(paText, FONT_SIZE);
                const flsTextWidth = font.widthOfTextAtSize(flsText, FONT_SIZE);

                const rectWidth = Math.max(paTextWidth, flsTextWidth, rubricaWidth || 0) + RECT_MARGIN * 2;
                const textHeight = 15; 
                const rectHeight = textHeight + (rubricaImage ? rubricaHeight + RUBRICA_SPACING : 0) + (rubricaImage ? RECT_MARGIN : RECT_MARGIN * 2);

                const rectX = width - rectWidth - RECT_MARGIN;
                const rectY = height - rectHeight - RECT_MARGIN;

                desenharRetangulo(page, rectX, rectY, rectWidth, rectHeight, rgb(1, 1, 1));

                const textX = rectX + rectWidth - RECT_MARGIN;
                const textY = rectY + rectHeight - 10;

                desenharTexto(page, paText, textX - paTextWidth, textY, font, FONT_SIZE, rgb(0, 0, 0));
                desenharTexto(page, flsText, textX - flsTextWidth, textY - TEXT_SPACING, font, FONT_SIZE, rgb(0, 0, 0));

                if (rubricaImage) {
                    const rubricaX = rectX + rectWidth - rubricaWidth - RECT_MARGIN;
                    const rubricaY = rectY + RECT_MARGIN;

                    page.drawImage(rubricaImage, {
                        x: rubricaX,
                        y: rubricaY,
                        width: rubricaWidth,
                        height: rubricaHeight,
                    });
                }

                numeroFolha++;
            }
        }

        const pdfBytesProcessado = await pdfDoc.save();
        const outputPath = `output_${Date.now()}.pdf`;
        fs.writeFileSync(outputPath, pdfBytesProcessado);

        return outputPath;
    } catch (error) {
        console.error('Erro ao processar o PDF:', error);
        throw new Error('Erro ao processar o PDF: ' + error.message);
    }
}

module.exports = { processarPDF };

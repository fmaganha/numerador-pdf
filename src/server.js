const express = require('express');
const multer = require('multer');
const pdfHandler = require('./pdfHandler');
const fs = require('fs');

const app = express();

// Configuração do Multer para usar memória em vez de disco
const upload = multer({ storage: multer.memoryStorage() }).fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'rubrica', maxCount: 1 }
]);

app.use(express.static('public'));

app.post('/processar-pdf', upload, async (req, res) => {
    const { numeroInicial, numeroProcesso, anoProcesso, incluirRubrica } = req.body;

    // Verifica se o PDF foi enviado
    if (!req.files['pdf']) {
        return res.status(400).send('PDF é obrigatório.');
    }

    const pdfBuffer = req.files['pdf'][0].buffer; // Buffer do PDF
    const rubricaBuffer = req.files['rubrica'] ? req.files['rubrica'][0].buffer : null; // Buffer da rubrica (se existir)

    // Validação da rubrica
    if (incluirRubrica === 'on' && !rubricaBuffer) {
        return res.status(400).send('Rubrica é obrigatória.');
    }

    try {
        const pdfPathProcessado = await pdfHandler.processarPDF(
            pdfBuffer, // Passa o buffer diretamente
            numeroInicial,
            numeroProcesso,
            anoProcesso,
            incluirRubrica === 'on',
            rubricaBuffer // Passa o buffer diretamente
        );

        res.download(pdfPathProcessado, 'documento_processado.pdf', (err) => {
            if (err) {
                console.error('Erro ao enviar o arquivo:', err);
                res.status(500).send('Erro ao enviar o arquivo');
            } else {
                // Exclui o arquivo temporário após o download
                fs.unlinkSync(pdfPathProcessado);
            }
        });
    } catch (error) {
        console.error('Erro ao processar o PDF:', error);
        res.status(500).send('Erro ao processar o PDF');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
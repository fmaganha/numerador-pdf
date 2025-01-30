const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfHandler = require('./pdfHandler');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/processar-pdf', upload.single('pdf'), async (req, res) => {
    const { numeroInicial, numeroProcesso, anoProcesso, incluirRubrica } = req.body;
    const rubricaPath = req.file ? req.file.path : null;

    try {
        const pdfPath = await pdfHandler.processarPDF(
            req.file.path,
            numeroInicial,
            numeroProcesso,
            anoProcesso,
            incluirRubrica,
            rubricaPath
        );

        res.download(pdfPath, 'documento_processado.pdf', (err) => {
            if (err) {
                console.error('Erro ao enviar o arquivo:', err);
                res.status(500).send('Erro ao enviar o arquivo');
            } else {
                // Exclui os arquivos temporários após o download
                fs.unlinkSync(pdfPath);
                if (rubricaPath) fs.unlinkSync(rubricaPath);
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
const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfHandler = require('./pdfHandler');
const fs = require('fs');

const app = express();

// Configuração do Multer para lidar com múltiplos arquivos
const upload = multer({ 
    dest: 'uploads/', 
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB, por exemplo
}).fields([
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

    const pdfPath = req.files['pdf'][0].path; // Caminho do PDF
    const rubricaPath = req.files['rubrica'] ? req.files['rubrica'][0].path : null; // Caminho da rubrica (se existir)

    // Validação da rubrica
    if (incluirRubrica === 'on' && !rubricaPath) {
        return res.status(400).send('Rubrica é obrigatória.');
    }

    try {
        console.log('Iniciando processamento do PDF...');
        const pdfPathProcessado = await pdfHandler.processarPDF(
            pdfPath,
            numeroInicial,
            numeroProcesso,
            anoProcesso,
            incluirRubrica === 'on', // Converte para booleano
            rubricaPath
        );
        console.log('PDF processado com sucesso!', pdfPathProcessado);

        res.download(pdfPathProcessado, 'documento_processado.pdf', (err) => {
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
        console.error('Erro ao processar o PDF:', error);  // Logs detalhados
        res.status(500).send(`Erro ao processar o PDF: ${error.message}`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

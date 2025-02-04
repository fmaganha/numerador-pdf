const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfHandler = require('./pdfHandler');
const fs = require('fs');

const app = express();

// Configuração do Multer
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
}).fields([{ name: 'pdf', maxCount: 1 }, { name: 'rubrica', maxCount: 1 }]);

// Middleware para servir arquivos estáticos
app.use(express.static('public'));

// Função para limpar arquivos temporários
function cleanupFiles(...files) {
  files.forEach((file) => {
    if (file && fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`Arquivo temporário removido: ${file}`);
      } catch (error) {
        console.error(`Erro ao remover arquivo temporário (${file}):`, error.message);
      }
    }
  });
}

// Rota POST para processar o PDF
app.post('/processar-pdf', upload, async (req, res) => {
  try {
    console.log('Iniciando processamento do PDF...');
    const { numeroInicial, numeroProcesso, anoProcesso, incluirRubrica, fontSize, rubricaHeight } = req.body;

    // Validação dos dados recebidos
    if (!req.files['pdf']) {
      console.error('Erro: Nenhum PDF enviado.');
      return res.status(400).send('PDF é obrigatório.');
    }

    const pdfPath = req.files['pdf'][0].path;
    const rubricaPath = req.files['rubrica'] ? req.files['rubrica'][0].path : null;

    if (incluirRubrica === 'on' && !rubricaPath) {
      console.error('Erro: Rubrica é obrigatória quando "Incluir Rubrica" está marcado.');
      return res.status(400).send('Rubrica é obrigatória.');
    }

    // Processamento do PDF
    const pdfPathProcessado = await pdfHandler.processarPDF(
      pdfPath,
      numeroInicial,
      numeroProcesso,
      anoProcesso,
      incluirRubrica === 'on',
      rubricaPath,
      fontSize,
      rubricaHeight
    );

    console.log('PDF processado com sucesso:', pdfPathProcessado);

    // Resposta ao cliente
    res.send(`/download/${path.basename(pdfPathProcessado)}`);

    // Limpeza de arquivos temporários
    cleanupFiles(pdfPath, rubricaPath);
  } catch (error) {
    console.error('Erro ao processar o PDF:', error.message);
    res.status(500).send(`Erro ao processar o PDF: ${error.message}`);
  }
});

// Rota GET para download do PDF
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, req.params.filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error(`Erro ao enviar o arquivo (${filePath}):`, err.message);
      res.status(500).send('Erro ao enviar o arquivo.');
    } else {
      console.log(`Arquivo enviado com sucesso: ${filePath}`);
      cleanupFiles(filePath); // Remove o arquivo após o download
    }
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
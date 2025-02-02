class PDFNumberingForm {
  constructor() {
    this.form = document.getElementById('pdf-numbering-form');
    this.pdfUpload = document.getElementById('pdf-upload');
    this.dragDropArea = document.getElementById('drag-drop-area');
    this.includeSignature = document.getElementById('include-signature');
    this.signatureUploadContainer = document.getElementById('signature-upload-container');
    this.signatureUpload = document.getElementById('signature-upload');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.messageOverlay = document.getElementById('message-overlay');
    this.signatureDragDropArea = document.getElementById('signature-drag-drop-area');
    this.signatureUpload = document.getElementById('signature-upload');
    this.uploadStatus = document.getElementById('upload-status'); // Novo elemento para mostrar o status de upload

    this.initEventListeners();
    this.initSignatureDragDropEventListeners();
  }

  initEventListeners() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.pdfUpload.addEventListener('change', this.handleFileSelect.bind(this)); // Adicionando o evento de mudança para o input de arquivo
    this.dragDropArea.addEventListener('click', () => this.pdfUpload.click());
    this.dragDropArea.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dragDropArea.addEventListener('drop', this.handleFileDrop.bind(this));
    this.includeSignature.addEventListener('change', this.toggleSignatureUpload.bind(this));
  }

  toggleSignatureUpload() {
    this.signatureUploadContainer.style.display = this.includeSignature.checked ? 'block' : 'none';
  }

  initSignatureDragDropEventListeners() {
    this.signatureDragDropArea.addEventListener('click', () => this.signatureUpload.click());
    this.signatureDragDropArea.addEventListener('dragover', this.handleSignatureDragOver.bind(this));
    this.signatureDragDropArea.addEventListener('drop', this.handleSignatureFileDrop.bind(this));
    this.signatureUpload.addEventListener('change', this.handleSignatureFileSelect.bind(this));
  }

  handleSignatureDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.signatureDragDropArea.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
  }

  handleSignatureFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.signatureDragDropArea.style.backgroundColor = '';
    const files = event.dataTransfer.files;
    this.signatureUpload.files = files;
    this.updateSignatureDragDropText();
  }

  handleSignatureFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.updateSignatureDragDropText();
    }
  }

  updateSignatureDragDropText() {
    const fileName = this.signatureUpload.files[0]?.name || 'Arraste e solte a rubrica aqui ou clique para selecionar';
    this.signatureDragDropArea.textContent = fileName;
  }

  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dragDropArea.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
  }

  handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dragDropArea.style.backgroundColor = '';

    const files = event.dataTransfer.files;
    this.pdfUpload.files = files;
    this.updateDragDropText();
    this.updateUploadStatus(); // Atualiza o status do upload
  }

  // Nova função para lidar com o evento de seleção de arquivo via clique
  handleFileSelect(event) {
    const file = event.target.files[0]; // Pega o primeiro arquivo selecionado
    if (file) {
      this.updateDragDropText();
      this.updateUploadStatus(); // Atualiza o status do upload
    }
  }

  updateDragDropText() {
    const fileName = this.pdfUpload.files[0]?.name || 'Arraste e solte o PDF aqui ou clique para selecionar';
    this.dragDropArea.textContent = fileName;
  }

  updateUploadStatus() {
    if (this.pdfUpload.files.length > 0) {
      this.uploadStatus.textContent = `PDF carregado: ${this.pdfUpload.files[0].name}`;
      this.uploadStatus.classList.add('success');
    } else {
      this.uploadStatus.textContent = 'Nenhum arquivo carregado.';
      this.uploadStatus.classList.remove('success');
    }
  }

  validateForm() {
    const requiredFields = this.form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      if (!field.value) {
        this.showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
        isValid = false;
      }
    });

    if (this.includeSignature.checked) {
      if (!this.signatureUpload.files.length) {
        this.showMessage('Por favor, envie uma rubrica', 'error');
        isValid = false;
      }
    }

    return isValid;
  }

  async handleSubmit(event) {
    event.preventDefault();
  
    // Gera um número aleatório entre 0 e 1
    const randomChance = Math.random();
    if (randomChance < 0.1) {
      // Chance de 1 em 2 de ativar o jumpscare
      showJumpscare();
      return; // Interrompe a função padrão
    }
  
    // Valida o formulário
    if (!this.validateForm()) return;
  
    // Processa o PDF normalmente
    const formData = new FormData(this.form);
    try {
      this.showLoadingOverlay();
      const response = await fetch('/processar-pdf', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const downloadLink = await response.text();
        window.location.href = downloadLink;
      } else {
        
      }
    } catch (error) {
      
    } finally {
      this.hideLoadingOverlay();
    }
  }

  showLoadingOverlay() {
    this.loadingOverlay.classList.remove('hidden');
  }

  hideLoadingOverlay() {
    this.loadingOverlay.classList.add('hidden');
  }

  showMessage(text, type) {
    this.messageOverlay.textContent = text;
    this.messageOverlay.className = `message-overlay ${type}`;
    this.messageOverlay.classList.remove('hidden');

    setTimeout(() => {
      this.messageOverlay.classList.add('hidden');
    }, 3000);
  }
}

// Função para animar a imagem de fundo
function animateBackgroundImage() {
  const backgroundImage = document.getElementById('background-image');
  if (!backgroundImage) return;

  // Define uma distância fixa para o movimento
  const fixedOffset = 390; // Distância fixa em pixels

  // Move a imagem para a direita
  backgroundImage.style.transform = `translate(calc(-100% + ${fixedOffset}px), -50%)`;

  // Aguarda um tempo e retorna à posição inicial
  setTimeout(() => {
    backgroundImage.style.transform = 'translate(-150%, -50%)';
  }, 2000); // Duração da animação
}

// Função para iniciar a animação aleatória
function startRandomAnimation() {
  setInterval(() => {
    animateBackgroundImage();
  }, Math.random() * 55000 + 53000); // Intervalo aleatório entre 3 e 8 segundos
}

// Inicia a animação quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  new PDFNumberingForm();
  startRandomAnimation();
});

function showJumpscare() {
  const jumpscareImage = document.getElementById('jumpscare-image');
  if (!jumpscareImage) return;

  // Mostra a imagem de jumpscare
  jumpscareImage.style.display = 'block';
  jumpscareImage.style.animation = 'jumpscare 0.5s ease-in-out';

  // Oculta a imagem após a animação
  setTimeout(() => {
    jumpscareImage.style.display = 'none';
    jumpscareImage.style.animation = '';
  }, 500); // Duração da animação
}

// Inicia a animação quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  new PDFNumberingForm();
  startRandomAnimation();
});

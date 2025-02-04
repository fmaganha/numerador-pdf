class PDFNumberingForm {
  constructor() {
    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    this.form = document.getElementById('pdf-numbering-form');
    this.pdfUpload = document.getElementById('pdf-upload');
    this.dragDropArea = document.getElementById('drag-drop-area');
    this.includeSignature = document.getElementById('include-signature');
    this.signatureUploadContainer = document.getElementById('signature-upload-container');
    this.signatureUpload = document.getElementById('signature-upload');
    this.signatureDragDropArea = document.getElementById('signature-drag-drop-area');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.messageOverlay = document.getElementById('message-overlay');
    this.uploadStatus = document.getElementById('upload-status');
  }

  initEventListeners() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.pdfUpload.addEventListener('change', this.handleFileSelect.bind(this));
    this.dragDropArea.addEventListener('click', () => this.pdfUpload.click());
    this.dragDropArea.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dragDropArea.addEventListener('drop', this.handleFileDrop.bind(this));
    this.includeSignature.addEventListener('change', this.toggleSignatureUpload.bind(this));

    // Event listeners para a rubrica
    this.signatureDragDropArea.addEventListener('click', () => this.signatureUpload.click());
    this.signatureDragDropArea.addEventListener('dragover', this.handleSignatureDragOver.bind(this)); // Corrigido aqui
    this.signatureDragDropArea.addEventListener('drop', this.handleSignatureFileDrop.bind(this)); // Corrigido aqui
    this.signatureUpload.addEventListener('change', this.handleSignatureFileSelect.bind(this));
  }

  toggleSignatureUpload() {
    this.signatureUploadContainer.style.display = this.includeSignature.checked ? 'block' : 'none';
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
    this.updateUploadStatus();
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.updateDragDropText();
      this.updateUploadStatus();
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
    if (files.length > 0) {
      this.signatureUpload.files = files;
      this.updateSignatureDragDropText();
    }
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
    console.log('Iniciando envio do formulário...');
    if (!this.validateForm()) {
      console.error('Erro na validação do formulário.');
      return;
    }
    const formData = new FormData(this.form);
    const fontSize = document.getElementById('font-size').value;
    const rubricaHeight = document.getElementById('rubrica-height').value;
    formData.append('fontSize', fontSize);
    formData.append('rubricaHeight', rubricaHeight);
    try {
      this.showLoadingOverlay();
      const response = await fetch('/processar-pdf', { method: 'POST', body: formData });
      if (response.ok) {
        const downloadLink = await response.text();
        window.location.href = downloadLink;
        console.log('PDF processado com sucesso.');
      } else {
        this.showMessage('Erro ao processar o PDF', 'error');
        console.error('Erro ao processar o PDF.');
      }
    } catch (error) {
      this.showMessage('Erro ao processar o PDF', 'error');
      console.error('Erro ao processar o PDF:', error.message);
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

document.addEventListener('DOMContentLoaded', () => {
  new PDFNumberingForm();
});
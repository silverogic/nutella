// Main PDF Text Editor Application Controller
import { loadPdfDocument, renderPageToCanvas, extractPageTextItems } from './pdfParser.js';
import { createSamplePdf } from './samplePdf.js';
import { exportVectorPdf, triggerDownload } from './pdfExporter.js';

class PdfEditorApp {
  constructor() {
    this.pdfDoc = null;
    this.pdfArrayBuffer = null;
    this.fileName = 'document.pdf';
    this.numPages = 0;
    this.currentPage = 1;
    this.scale = 1.2;
    this.textBlocksByPage = {}; // { pageNum: [ block1, block2, ... ] }
    this.selectedBlock = null;
    this.activeTool = 'select'; // 'select' | 'addText'

    this.initElements();
    this.initEventListeners();
    this.initLucideIcons();
  }

  initElements() {
    // Header & Controls
    this.elFilePicker = document.getElementById('filePicker');
    this.btnOpen = document.getElementById('btnOpen');
    this.btnSample = document.getElementById('btnSample');
    this.btnExport = document.getElementById('btnExport');
    this.btnPrevPage = document.getElementById('btnPrevPage');
    this.btnNextPage = document.getElementById('btnNextPage');
    this.inputPageNum = document.getElementById('inputPageNum');
    this.elTotalPages = document.getElementById('totalPages');
    this.btnZoomIn = document.getElementById('btnZoomIn');
    this.btnZoomOut = document.getElementById('btnZoomOut');
    this.btnZoomReset = document.getElementById('btnZoomReset');
    this.elZoomVal = document.getElementById('zoomVal');
    this.btnAddText = document.getElementById('btnAddText');
    this.btnToolSelect = document.getElementById('btnToolSelect');

    // Layout containers
    this.elEmptyLanding = document.getElementById('emptyLanding');
    this.elDropZone = document.getElementById('dropZone');
    this.elSidebar = document.getElementById('sidebar');
    this.elThumbnailList = document.getElementById('thumbnailList');
    this.elWorkspaceViewport = document.getElementById('workspaceViewport');
    this.elPageContainer = document.getElementById('pageContainer');
    this.elPdfCanvas = document.getElementById('pdfCanvas');
    this.elTextOverlayLayer = document.getElementById('textOverlayLayer');
    this.elInspectorPanel = document.getElementById('inspectorPanel');

    // Inspector inputs
    this.inpBlockText = document.getElementById('inpBlockText');
    this.inpFontSize = document.getElementById('inpFontSize');
    this.valFontSize = document.getElementById('valFontSize');
    this.inpTextColor = document.getElementById('inpTextColor');
    this.inpBgColor = document.getElementById('inpBgColor');
    this.chkMaskOriginal = document.getElementById('chkMaskOriginal');
    this.btnDeleteBlock = document.getElementById('btnDeleteBlock');
    this.elSelectedInfo = document.getElementById('selectedInfo');
  }

  initEventListeners() {
    // File opening
    this.btnOpen.addEventListener('click', () => this.elFilePicker.click());
    this.elFilePicker.addEventListener('change', (e) => this.handleFileSelect(e));
    this.btnSample.addEventListener('click', () => this.loadSampleDocument());

    // Drag and drop
    this.elDropZone.addEventListener('click', () => this.elFilePicker.click());
    this.elDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.elDropZone.classList.add('drag-over');
    });
    this.elDropZone.addEventListener('dragleave', () => this.elDropZone.classList.remove('drag-over'));
    this.elDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.elDropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.openPdfFile(e.dataTransfer.files[0]);
      }
    });

    // Page Navigation
    this.btnPrevPage.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    this.btnNextPage.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    this.inputPageNum.addEventListener('change', () => {
      const page = parseInt(this.inputPageNum.value, 10);
      if (!isNaN(page)) this.goToPage(page);
    });

    // Zoom
    this.btnZoomIn.addEventListener('click', () => this.setZoom(this.scale + 0.15));
    this.btnZoomOut.addEventListener('click', () => this.setZoom(this.scale - 0.15));
    this.btnZoomReset.addEventListener('click', () => this.setZoom(1.2));

    // Tools
    this.btnToolSelect.addEventListener('click', () => this.setTool('select'));
    this.btnAddText.addEventListener('click', () => this.setTool('addText'));

    // Canvas Workspace click for adding new text
    this.elPageContainer.addEventListener('click', (e) => this.handleCanvasClick(e));

    // Export
    this.btnExport.addEventListener('click', () => this.exportPdfDocument());

    // Inspector Panel Input bindings
    this.inpBlockText.addEventListener('input', () => {
      if (this.selectedBlock) {
        this.selectedBlock.text = this.inpBlockText.value;
        this.selectedBlock.isEdited = true;
        this.renderTextOverlay();
      }
    });

    this.inpFontSize.addEventListener('input', () => {
      if (this.selectedBlock) {
        const size = parseInt(this.inpFontSize.value, 10);
        this.selectedBlock.fontSize = size;
        this.valFontSize.textContent = `${size}px`;
        if (this.selectedBlock.pdfBounds) {
          this.selectedBlock.pdfBounds.fontSize = size;
        }
        this.renderTextOverlay();
      }
    });

    this.inpTextColor.addEventListener('input', () => {
      if (this.selectedBlock) {
        this.selectedBlock.color = this.inpTextColor.value;
        this.renderTextOverlay();
      }
    });

    this.inpBgColor.addEventListener('input', () => {
      if (this.selectedBlock) {
        this.selectedBlock.bgColor = this.inpBgColor.value;
        this.renderTextOverlay();
      }
    });

    this.chkMaskOriginal.addEventListener('change', () => {
      if (this.selectedBlock) {
        this.selectedBlock.isMasked = this.chkMaskOriginal.checked;
        this.renderTextOverlay();
      }
    });

    this.btnDeleteBlock.addEventListener('click', () => {
      if (this.selectedBlock) {
        this.deleteSelectedBlock();
      }
    });
  }

  initLucideIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  setTool(tool) {
    this.activeTool = tool;
    if (tool === 'select') {
      this.btnToolSelect.classList.add('btn-active');
      this.btnAddText.classList.remove('btn-active');
      this.elPageContainer.style.cursor = 'default';
    } else if (tool === 'addText') {
      this.btnAddText.classList.add('btn-active');
      this.btnToolSelect.classList.remove('btn-active');
      this.elPageContainer.style.cursor = 'crosshair';
      this.showToast('페이지의 원하는 위치를 클릭하여 새 텍스트를 추가하세요.', 'info');
    }
  }

  async handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      await this.openPdfFile(file);
    }
  }

  async openPdfFile(file) {
    this.fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    await this.loadArrayBuffer(arrayBuffer);
  }

  async loadSampleDocument() {
    this.showToast('샘플 PDF 생성 중...', 'info');
    try {
      const sampleBytes = await createSamplePdf();
      this.fileName = 'sample_korean_document.pdf';
      await this.loadArrayBuffer(sampleBytes.buffer);
      this.showToast('샘플 PDF가 열렸습니다! 글자를 클릭하여 편집해보세요.', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('샘플 PDF 로드 실패: ' + err.message, 'error');
    }
  }

  async loadArrayBuffer(arrayBuffer) {
    try {
      // Store a fresh copy so arrayBuffer is never detached for export
      this.pdfArrayBuffer = arrayBuffer.slice ? arrayBuffer.slice(0) : new Uint8Array(arrayBuffer).slice(0).buffer;
      this.pdfDoc = await loadPdfDocument(this.pdfArrayBuffer);
      this.numPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      this.textBlocksByPage = {};
      this.selectedBlock = null;

      this.elTotalPages.textContent = `/ ${this.numPages}`;
      this.inputPageNum.value = 1;

      // Extract text items for all pages
      for (let p = 1; p <= this.numPages; p++) {
        const blocks = await extractPageTextItems(this.pdfDoc, p, this.scale);
        this.textBlocksByPage[p] = blocks;
      }

      this.elEmptyLanding.style.display = 'none';
      this.elSidebar.classList.remove('collapsed');

      await this.renderCurrentPage();
      await this.renderThumbnails();
      this.updateInspectorPanel();
      this.initLucideIcons();
    } catch (err) {
      console.error(err);
      this.showToast('PDF 파일 읽기 오류: ' + err.message, 'error');
    }
  }

  async renderCurrentPage() {
    if (!this.pdfDoc) return;

    // Render Canvas
    const dimensions = await renderPageToCanvas(this.pdfDoc, this.currentPage, this.elPdfCanvas, this.scale);
    this.elPageContainer.style.width = `${dimensions.width}px`;
    this.elPageContainer.style.height = `${dimensions.height}px`;

    // Render Text Overlay Layer
    this.renderTextOverlay();
  }

  renderTextOverlay() {
    this.elTextOverlayLayer.innerHTML = '';
    const blocks = this.textBlocksByPage[this.currentPage] || [];

    blocks.forEach((block) => {
      const box = document.createElement('div');
      box.className = 'text-block-box';
      const isSelected = this.selectedBlock && this.selectedBlock.id === block.id;

      if (isSelected) {
        box.classList.add('selected');
      }

      box.style.left = `${block.x}px`;
      box.style.top = `${block.y}px`;
      box.style.minWidth = `${Math.max(24, block.width)}px`;
      box.style.minHeight = `${Math.max(16, block.height)}px`;

      const isEditedOrMasked = block.isEdited || block.isNew || block.isMasked;

      // Mask background element covers original canvas text ONLY when edited, new, or masked
      if (isEditedOrMasked) {
        const mask = document.createElement('div');
        mask.className = 'text-block-mask';
        mask.style.backgroundColor = block.bgColor || '#ffffff';
        box.appendChild(mask);
      }

      // Create interactive inline text input for direct on-canvas editing
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'inline-edit-input';
      input.value = block.text;
      input.style.fontSize = `${block.fontSize}px`;
      input.style.color = block.color || '#000000';
      input.style.fontFamily = block.fontFamily || "'Noto Sans KR', 'Inter', sans-serif";

      // If NOT edited and NOT masked, make input text transparent so original canvas text shows until edited
      if (!isEditedOrMasked) {
        input.style.color = 'transparent';
      }

      // Event Listeners for Direct Inline Editing
      input.addEventListener('focus', () => {
        if (!this.selectedBlock || this.selectedBlock.id !== block.id) {
          this.selectBlock(block);
        }
      });

      input.addEventListener('input', (e) => {
        block.text = e.target.value;
        block.isEdited = true;
        block.isMasked = true;

        // Auto expand input width as user types
        const tempSpan = document.createElement('span');
        tempSpan.style.font = `${block.fontSize}px 'Noto Sans KR', sans-serif`;
        tempSpan.style.visibility = 'hidden';
        tempSpan.textContent = block.text;
        document.body.appendChild(tempSpan);
        const newWidth = Math.max(block.width, tempSpan.offsetWidth + 20);
        document.body.removeChild(tempSpan);

        box.style.width = `${newWidth}px`;
        if (block.pdfBounds) {
          block.pdfBounds.width = newWidth / this.scale;
        }

        // Sync right inspector panel
        if (this.inpBlockText) {
          this.inpBlockText.value = block.text;
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });

      box.appendChild(input);

      box.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.activeTool === 'select') {
          if (!this.selectedBlock || this.selectedBlock.id !== block.id) {
            this.selectBlock(block);
          }
        }
      });

      // Enable dragging for moving text box
      this.makeDraggable(box, block);

      this.elTextOverlayLayer.appendChild(box);
    });
  }

  makeDraggable(element, block) {
    let startX = 0, startY = 0, initialX = block.x, initialY = block.y;

    element.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      startX = e.clientX;
      startY = e.clientY;
      initialX = block.x;
      initialY = block.y;

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          block.isEdited = true;
          block.isMasked = true;
        }
        block.x = initialX + dx;
        block.y = initialY + dy;

        if (block.pdfBounds) {
          block.pdfBounds.x += dx / this.scale;
          block.pdfBounds.y += dy / this.scale;
        }

        element.style.left = `${block.x}px`;
        element.style.top = `${block.y}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        this.renderTextOverlay();
        this.updateInspectorPanel();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  handleCanvasClick(e) {
    if (this.activeTool === 'addText') {
      const rect = this.elPageContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const newBlock = {
        id: `text_p${this.currentPage}_new_${Date.now()}`,
        pageNum: this.currentPage,
        originalText: '',
        text: '새 텍스트 입력',
        x: clickX,
        y: clickY,
        width: 140,
        height: 28,
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#000000',
        bgColor: '#ffffff',
        isEdited: true,
        isMasked: false,
        isNew: true
      };

      if (!this.textBlocksByPage[this.currentPage]) {
        this.textBlocksByPage[this.currentPage] = [];
      }
      this.textBlocksByPage[this.currentPage].push(newBlock);

      this.selectBlock(newBlock);
      this.setTool('select');
      this.renderTextOverlay();
      this.showToast('새 텍스트가 추가되었습니다. 오른쪽 패널에서 글자를 수정하세요.', 'success');
    } else {
      // Click on background unselects block
      if (e.target === this.elPageContainer || e.target === this.elPdfCanvas || e.target === this.elTextOverlayLayer) {
        this.selectBlock(null);
      }
    }
  }

  selectBlock(block) {
    this.selectedBlock = block;
    this.renderTextOverlay();
    this.updateInspectorPanel();
  }

  updateInspectorPanel() {
    if (!this.selectedBlock) {
      this.elSelectedInfo.textContent = '선택된 텍스트가 없습니다. PDF 상의 글자를 클릭하세요.';
      this.inpBlockText.value = '';
      this.inpBlockText.disabled = true;
      this.inpFontSize.disabled = true;
      this.inpTextColor.disabled = true;
      this.inpBgColor.disabled = true;
      this.chkMaskOriginal.disabled = true;
      this.btnDeleteBlock.disabled = true;
      return;
    }

    const b = this.selectedBlock;
    this.elSelectedInfo.textContent = `ID: ${b.id} | Page: ${b.pageNum}`;
    this.inpBlockText.disabled = false;
    this.inpBlockText.value = b.text;
    this.inpFontSize.disabled = false;
    this.inpFontSize.value = b.fontSize;
    this.valFontSize.textContent = `${b.fontSize}px`;
    this.inpTextColor.disabled = false;
    this.inpTextColor.value = b.color || '#000000';
    this.inpBgColor.disabled = false;
    this.inpBgColor.value = b.bgColor || '#ffffff';
    this.chkMaskOriginal.disabled = false;
    this.chkMaskOriginal.checked = !!b.isMasked;
    this.btnDeleteBlock.disabled = false;
  }

  deleteSelectedBlock() {
    if (!this.selectedBlock) return;
    const blocks = this.textBlocksByPage[this.currentPage] || [];
    const index = blocks.findIndex(b => b.id === this.selectedBlock.id);

    if (index !== -1) {
      if (this.selectedBlock.isNew) {
        blocks.splice(index, 1);
      } else {
        // Clear text and keep background mask if original
        this.selectedBlock.text = '';
        this.selectedBlock.isEdited = true;
        this.selectedBlock.isMasked = true;
      }
      this.selectBlock(null);
      this.renderTextOverlay();
      this.showToast('텍스트 항목이 삭제/마스킹 되었습니다.', 'info');
    }
  }

  async goToPage(pageNum) {
    if (pageNum < 1 || pageNum > this.numPages || pageNum === this.currentPage) return;
    this.currentPage = pageNum;
    this.inputPageNum.value = pageNum;
    this.selectedBlock = null;
    await this.renderCurrentPage();
    this.updateThumbnailActiveState();
    this.updateInspectorPanel();
  }

  setZoom(newScale) {
    if (newScale < 0.5 || newScale > 2.5) return;
    this.scale = Math.round(newScale * 100) / 100;
    this.elZoomVal.textContent = `${Math.round(this.scale * 100)}%`;
    this.renderCurrentPage();
  }

  async renderThumbnails() {
    this.elThumbnailList.innerHTML = '';
    for (let p = 1; p <= this.numPages; p++) {
      const card = document.createElement('div');
      card.className = `thumbnail-card ${p === this.currentPage ? 'active' : ''}`;
      card.dataset.pageNum = p;

      const canvasWrap = document.createElement('div');
      canvasWrap.className = 'thumbnail-canvas-wrapper';
      const thumbCanvas = document.createElement('canvas');
      canvasWrap.appendChild(thumbCanvas);

      const label = document.createElement('div');
      label.className = 'thumbnail-label';
      label.textContent = `Page ${p}`;

      card.appendChild(canvasWrap);
      card.appendChild(label);

      card.addEventListener('click', () => this.goToPage(p));
      this.elThumbnailList.appendChild(card);

      // Render thumb canvas at small scale
      renderPageToCanvas(this.pdfDoc, p, thumbCanvas, 0.25);
    }
  }

  updateThumbnailActiveState() {
    const cards = this.elThumbnailList.querySelectorAll('.thumbnail-card');
    cards.forEach(card => {
      const p = parseInt(card.dataset.pageNum, 10);
      if (p === this.currentPage) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  async exportPdfDocument() {
    if (!this.pdfArrayBuffer && this.numPages === 0) {
      this.showToast('수정할 PDF 파일이 로드되지 않았습니다.', 'error');
      return;
    }

    this.showToast('한글 임베딩 PDF 저장 중...', 'info');

    try {
      const editedPdfBytes = await exportVectorPdf(
        this.pdfArrayBuffer,
        this.textBlocksByPage,
        this.numPages
      );

      const outName = this.fileName.replace(/\.pdf$/i, '') + '_edited.pdf';
      triggerDownload(editedPdfBytes, outName);
      this.showToast(`PDF 저장 완료! (${outName})`, 'success');
    } catch (err) {
      console.error(err);
      this.showToast('PDF 내보내기 실패: ' + err.message, 'error');
    }
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new PdfEditorApp();
});

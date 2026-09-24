// i18n Translation Dictionary and Locale Manager
// Follows silverogic/uxui guidelines:
// "For web applications, the language corresponding to the user's access region is displayed by default; otherwise, English is used as the default."

export const translations = {
  en: {
    appTitle: "PDF Text Editor",
    openPdf: "Open PDF",
    samplePdf: "Sample PDF",
    samplePdfTooltip: "Test with sample PDF document",
    toolSelect: "Edit Text",
    toolSelectTooltip: "Text selection and direct on-canvas editing mode",
    addText: "+ Add Text",
    addTextTooltip: "Insert a new text box on the document",
    zoomOut: "Zoom Out",
    zoomIn: "Zoom In",
    zoomReset: "Reset Zoom",
    exportPdf: "Export PDF",
    pageList: "Page List",
    pageLabel: "Page {p}",
    dropTitle: "Drag and drop your PDF file here",
    dropDesc: "Or click to select a file from your computer, or test editing right away with a sample PDF.",
    selectFile: "Select from Computer",
    testSample: "Test with Sample PDF",
    inspectorTitle: "Text Properties",
    noSelectedText: "No text selected. Click any text on the PDF to edit.",
    selectedInfo: "ID: {id} | Page: {pageNum}",
    textContentLabel: "Edit Text Content",
    textPlaceholder: "Enter text content...",
    fontSizeLabel: "Font Size",
    textColorLabel: "Text Color",
    maskLabel: "Whiteout Original Text",
    maskCheckbox: "Cover original text background",
    bgColorLabel: "Mask Background Color",
    deleteBlock: "Delete Text Item",
    toastAddTextHint: "Click anywhere on the page to insert new text.",
    toastSampleGenerating: "Generating sample PDF...",
    toastSampleSuccess: "Sample PDF loaded! Click any text to edit.",
    toastSampleError: "Failed to load sample PDF: {err}",
    toastPdfError: "Error reading PDF file: {err}",
    toastNewBlockAdded: "New text added. Edit directly on canvas or in the right panel.",
    toastBlockDeleted: "Text item deleted/masked.",
    toastExporting: "Generating PDF...",
    toastExportSuccess: "PDF saved successfully! ({name})",
    toastExportError: "PDF export failed: {err}",
    toastNoFile: "No PDF file loaded to export."
  },
  ko: {
    appTitle: "PDF 텍스트 편집기",
    openPdf: "PDF 열기",
    samplePdf: "샘플 PDF",
    samplePdfTooltip: "샘플 PDF 문서로 테스트",
    toolSelect: "글자 편집",
    toolSelectTooltip: "텍스트 선택 및 직접 편집 모드",
    addText: "+ 텍스트 추가",
    addTextTooltip: "새 텍스트 상자 추가",
    zoomOut: "축소",
    zoomIn: "확대",
    zoomReset: "기본 크기",
    exportPdf: "PDF 저장 (Export)",
    pageList: "페이지 목록",
    pageLabel: "Page {p}",
    dropTitle: "편집할 PDF 파일을 마우스로 끌어오세요",
    dropDesc: "또는 버튼을 눌러 PDF 파일을 선택하시거나, 바로 샘플 PDF로 편집을 체험해보실 수 있습니다.",
    selectFile: "내 컴퓨터에서 선택",
    testSample: "샘플 PDF로 테스트",
    inspectorTitle: "텍스트 속성 설정",
    noSelectedText: "선택된 텍스트가 없습니다. PDF 상의 글자를 클릭하세요.",
    selectedInfo: "ID: {id} | Page: {pageNum}",
    textContentLabel: "텍스트 내용 수정",
    textPlaceholder: "글자 내용을 입력하세요...",
    fontSizeLabel: "글자 크기 (Font Size)",
    textColorLabel: "글자 색상 (Text Color)",
    maskLabel: "기존 글자 덮어쓰기 (Whiteout Mask)",
    maskCheckbox: "기존 글자 배경 덮어쓰기",
    bgColorLabel: "마스크 배경색 (Background Color)",
    deleteBlock: "텍스트 항목 삭제",
    toastAddTextHint: "페이지의 원하는 위치를 클릭하여 새 텍스트를 추가하세요.",
    toastSampleGenerating: "샘플 PDF 생성 중...",
    toastSampleSuccess: "샘플 PDF가 열렸습니다! 글자를 클릭하여 편집해보세요.",
    toastSampleError: "샘플 PDF 로드 실패: {err}",
    toastPdfError: "PDF 파일 읽기 오류: {err}",
    toastNewBlockAdded: "새 텍스트가 추가되었습니다. 문서 위에서 직접 수정하거나 오른쪽 패널을 사용하세요.",
    toastBlockDeleted: "텍스트 항목이 삭제/마스킹 되었습니다.",
    toastExporting: "PDF 저장 중...",
    toastExportSuccess: "PDF 저장 완료! ({name})",
    toastExportError: "PDF 내보내기 실패: {err}",
    toastNoFile: "수정할 PDF 파일이 로드되지 않았습니다."
  }
};

class I18nManager {
  constructor() {
    this.currentLocale = this.detectLocale();
  }

  detectLocale() {
    const saved = localStorage.getItem('app_locale');
    if (saved && (saved === 'ko' || saved === 'en')) {
      return saved;
    }
    const userLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (userLang.startsWith('ko')) {
      return 'ko';
    }
    return 'en';
  }

  setLocale(locale) {
    if (locale !== 'ko' && locale !== 'en') return;
    this.currentLocale = locale;
    localStorage.setItem('app_locale', locale);
    document.documentElement.lang = locale;
    this.applyToDOM();
  }

  t(key, params = {}) {
    let str = translations[this.currentLocale]?.[key] || translations['en']?.[key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return str;
  }

  applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    const langToggleLabel = document.getElementById('langToggleLabel');
    if (langToggleLabel) {
      langToggleLabel.textContent = this.currentLocale.toUpperCase();
    }
  }
}

export const i18n = new I18nManager();

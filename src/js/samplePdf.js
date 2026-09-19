// Sample PDF Generator using PDF-Lib
export async function createSamplePdf() {
  if (typeof PDFLib === 'undefined') {
    throw new Error('PDFLib is not loaded');
  }

  const { PDFDocument, rgb, StandardFonts } = PDFLib;
  const pdfDoc = await PDFDocument.create();

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

  // --- Page 1 ---
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width: p1Width, height: p1Height } = page1.getSize();

  // Header Banner Box
  page1.drawRectangle({
    x: 40,
    y: p1Height - 120,
    width: p1Width - 80,
    height: 80,
    color: rgb(0.12, 0.15, 0.28),
  });

  page1.drawText('PDF Editor GUI - Document Sample', {
    x: 60,
    y: p1Height - 75,
    size: 20,
    font: fontHelveticaBold,
    color: rgb(0.9, 0.95, 1),
  });

  page1.drawText('Interactive Text Modification & Vector Export System', {
    x: 60,
    y: p1Height - 100,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.6, 0.7, 0.9),
  });

  // Section 1: Overview
  page1.drawText('1. Overview & Instructions', {
    x: 40,
    y: p1Height - 160,
    size: 14,
    font: fontHelveticaBold,
    color: rgb(0.1, 0.1, 0.2),
  });

  page1.drawText('Welcome to the PDF Text Editor GUI. You can click on any text block on this page', {
    x: 40,
    y: p1Height - 185,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.25),
  });

  page1.drawText('to select, edit, re-position, resize, or change colors. Original underlying text is masked.', {
    x: 40,
    y: p1Height - 205,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.25),
  });

  // Key Features Card Box
  page1.drawRectangle({
    x: 40,
    y: p1Height - 340,
    width: p1Width - 80,
    height: 110,
    color: rgb(0.96, 0.97, 1),
    borderColor: rgb(0.7, 0.75, 0.95),
    borderWidth: 1,
  });

  page1.drawText('Feature Summary:', {
    x: 55,
    y: p1Height - 260,
    size: 12,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.2, 0.5),
  });

  page1.drawText('* Edit existing PDF text directly by clicking any bounding box', {
    x: 65,
    y: p1Height - 280,
    size: 10.5,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  page1.drawText('* Add new custom text boxes anywhere on the document canvas', {
    x: 65,
    y: p1Height - 300,
    size: 10.5,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  page1.drawText('* Export modified document back to native PDF format seamlessly', {
    x: 65,
    y: p1Height - 320,
    size: 10.5,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Table Example
  page1.drawText('2. Sample Data Table', {
    x: 40,
    y: p1Height - 380,
    size: 14,
    font: fontHelveticaBold,
    color: rgb(0.1, 0.1, 0.2),
  });

  // Table Header
  page1.drawRectangle({
    x: 40,
    y: p1Height - 420,
    width: p1Width - 80,
    height: 25,
    color: rgb(0.2, 0.25, 0.4),
  });

  page1.drawText('Item ID', { x: 55, y: p1Height - 412, size: 10, font: fontHelveticaBold, color: rgb(1,1,1) });
  page1.drawText('Description', { x: 150, y: p1Height - 412, size: 10, font: fontHelveticaBold, color: rgb(1,1,1) });
  page1.drawText('Status', { x: 380, y: p1Height - 412, size: 10, font: fontHelveticaBold, color: rgb(1,1,1) });
  page1.drawText('Value', { x: 480, y: p1Height - 412, size: 10, font: fontHelveticaBold, color: rgb(1,1,1) });

  // Row 1
  page1.drawText('TASK-101', { x: 55, y: p1Height - 440, size: 10, font: fontCourier, color: rgb(0.2,0.2,0.2) });
  page1.drawText('PDF Renderer Module', { x: 150, y: p1Height - 440, size: 10, font: fontHelvetica, color: rgb(0.2,0.2,0.2) });
  page1.drawText('Completed', { x: 380, y: p1Height - 440, size: 10, font: fontHelvetica, color: rgb(0.1,0.6,0.2) });
  page1.drawText('$1,250.00', { x: 480, y: p1Height - 440, size: 10, font: fontCourier, color: rgb(0.2,0.2,0.2) });

  // Row 2
  page1.drawText('TASK-102', { x: 55, y: p1Height - 465, size: 10, font: fontCourier, color: rgb(0.2,0.2,0.2) });
  page1.drawText('Text Bounding Box Inspector', { x: 150, y: p1Height - 465, size: 10, font: fontHelvetica, color: rgb(0.2,0.2,0.2) });
  page1.drawText('In Progress', { x: 380, y: p1Height - 465, size: 10, font: fontHelvetica, color: rgb(0.8,0.4,0.1) });
  page1.drawText('$3,400.00', { x: 480, y: p1Height - 465, size: 10, font: fontCourier, color: rgb(0.2,0.2,0.2) });

  // Footer Note
  page1.drawText('Page 1 of 2 -- PDF Editor GUI Sample', {
    x: p1Width / 2 - 80,
    y: 30,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --- Page 2 ---
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const { width: p2Width, height: p2Height } = page2.getSize();

  page2.drawText('3. Secondary Page Details', {
    x: 40,
    y: p2Height - 60,
    size: 16,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.15, 0.28),
  });

  page2.drawText('This second page demonstrates multi-page navigation and page thumbnail rendering.', {
    x: 40,
    y: p2Height - 90,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.3, 0.3, 0.35),
  });

  // Note Box
  page2.drawRectangle({
    x: 40,
    y: p2Height - 200,
    width: p2Width - 80,
    height: 80,
    color: rgb(0.98, 0.95, 0.9),
    borderColor: rgb(0.9, 0.7, 0.4),
    borderWidth: 1,
  });

  page2.drawText('Important Note:', {
    x: 55,
    y: p2Height - 145,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.6, 0.3, 0.1),
  });

  page2.drawText('Try adding a new text element on Page 2 using the "+ Add Text" button in the toolbar.', {
    x: 55,
    y: p2Height - 170,
    size: 10.5,
    font: fontHelvetica,
    color: rgb(0.3, 0.2, 0.1),
  });

  page2.drawText('Page 2 of 2 -- PDF Editor GUI Sample', {
    x: p2Width / 2 - 80,
    y: 30,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

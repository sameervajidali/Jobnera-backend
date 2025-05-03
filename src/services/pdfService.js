// src/services/pdfService.js
import PDFDocument from 'pdfkit';

/**
 * Generates a PDF buffer from resume data
 * @param {Object} data - Resume content structured by sections
 * @returns {Promise<Buffer>} - Promise resolving to PDF buffer
 */
export const generatePDF = (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Title
    doc.fontSize(20).text('Resume', { align: 'center' }).moveDown();

    // Content sections
    Object.entries(data).forEach(([section, content]) => {
      doc.fontSize(16).fillColor('#333').text(section, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000');

      if (Array.isArray(content)) {
        content.forEach(item => {
          if (typeof item === 'string') {
            doc.text(`• ${item}`);
          } else {
            doc.text(JSON.stringify(item, null, 2));
          }
        });
      } else if (typeof content === 'object') {
        doc.text(JSON.stringify(content, null, 2));
      } else {
        doc.text(String(content));
      }

      doc.moveDown();
    });

    // Finalize PDF
    doc.end();
  });
};

// Default export for import convenience
export default generatePDF ;


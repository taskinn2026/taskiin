/**
 * PDF Service for Booking Voucher Generation
 * Uses HTML2Canvas + jsPDF to support Arabic fonts and complex layout
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate PDF from a DOM element
 * This solves Arabic font rendering issues by snapshotting the actual rendered HTML
 * @param {HTMLElement} element - The hidden DOM element containing the voucher
 * @param {string} filename - Output filename
 */
export const generateBookingPdf = async (element, filename = 'voucher.pdf') => {
    if (!element) {
        throw new Error('Voucher element not found. Please ensure the template is rendered.');
    }

    try {
        // Wait for images to load if needed (though usually React handles this)
        // Capture at 2x scale for better quality
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true, // Allow loading cross-origin images (like avatars/logos)
            logging: false,
            backgroundColor: '#ffffff', // Ensure white background
            windowWidth: 794, // A4 width at 96 DPI (approx)
        });

        const imgData = canvas.toDataURL('image/png');

        // A4 dimensions in mm
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm

        // Calculate dimensions to fit width
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

        // Save
        pdf.save(filename);

        return true;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    }
};

export default { generateBookingPdf };

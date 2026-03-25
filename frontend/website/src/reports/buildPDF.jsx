import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import '../../public/fonts/NotoSerif-Bold-Normal.js';
import '../../public/fonts/Lato-Regular-Normal.js';

export default async function BuildPDF(birdboxes) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    //Rectangle header
    doc.setFillColor(0, 76, 152);
    doc.rect(0, 0, pageWidth, 20, 'F');
    //header logo
    const logo = await loadImageAsBase64('/images/GLTLogo.jpg');
    if (logo) {
        doc.addImage(logo, 'PNG', 4, 3, 0, 14); // x, y, width (0 = auto), height
    }

    let y = 30;

    //Title
    doc.setFontSize(16);
    doc.addFont('NotoSerif-Bold-Normal.ttf', 'NotoSerif-Bold', 'normal');
    doc.setFont('NotoSerif-Bold', 'normal');
    doc.text("Birdbox Report", 14, y);
    y += 8;

    //Box list
    doc.setFontSize(11);
    doc.addFont('Lato-Regular.ttf', 'Lato-Regular', 'normal');
    doc.setFont('Lato-Regular', 'normal');
    birdboxes.forEach((box) => {
        doc.text(`• ${box.birdbox_name}`, 18, y);
        y += 6;
    });

    autoTable(doc, {
        startY: y + 4,
        head: [['Box Name', 'Location', 'Last Captured', 'Last Kestrel']],
        headStyles:{
            fillColor: [0, 76, 152]
        },
        body: birdboxes.map((box) => [
            box.birdbox_name,
            box.location,
            box.last_captured_image?.timestamp
                ? new Date(box.last_captured_image.timestamp).toLocaleString().replace(', ', '\n')
                : 'N/A',
            box.last_identified_kestrel?.timestamp
                ? new Date(box.last_identified_kestrel.timestamp).toLocaleString().replace(', ', '\n')
                : 'N/A',
        ]),
    });

    doc.save('report.pdf');
}

//helper func to convert the image to base64 for embedding in PDF
async function loadImageAsBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error('Failed to load logo:', err);
        return null;
    }
}

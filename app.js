const express = require('express');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

app.post('/merge-pdfs', async (req, res) => {
    const { files } = req.body;

    // Validate the input
    if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).send('Invalid input: files array is required.');
    }

    try {
        const mergedPdf = await mergePDFs(files);
        const outputPath = path.join(__dirname, 'merged.pdf');
        await fs.promises.writeFile(outputPath, mergedPdf);

        res.download(outputPath, 'merged.pdf', (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error downloading the merged PDF');
            } else {
                fs.unlink(outputPath, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error merging PDF files');
    }
});

const mergePDFs = async (files) => {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        // Ensure the file path is correct
        const pdfBytes = await fs.promises.readFile(path.resolve(__dirname, file));
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await pdf.getPages(); // Get the pages from the loaded PDF

        // Copy each page from the current PDF to the merged PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pages.map((_, i) => i));
        for (const page of copiedPages) {
            mergedPdf.addPage(page); // Add the copied page to the merged PDF
        }
    }

    return await mergedPdf.save(); // Save and return the merged PDF bytes
};

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
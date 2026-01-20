const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    try {
        // Paths
        const htmlRelativePath = '../../generated_documents/business_plan.html';
        const pdfRelativePath = '../../generated_documents/business_plan.pdf';
        
        const htmlPath = path.resolve(__dirname, htmlRelativePath);
        const pdfPath = path.resolve(__dirname, pdfRelativePath);

        console.log(`Loading HTML from: ${htmlPath}`);
        
        if (!fs.existsSync(htmlPath)) {
            console.error('Error: HTML file not found!');
            process.exit(1);
        }

        const browser = await puppeteer.launch({
            headless: 'new'
        });
        const page = await browser.newPage();

        // Load the local HTML file
        // We use 'file://' protocol
        await page.goto(`file://${htmlPath}`, {
            waitUntil: 'networkidle0' // Wait until network is idle (images loaded, etc.)
        });

        console.log('Generating PDF...');
        
        // PDF options
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true, // Print background colors/images
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        console.log(`PDF successfully created at: ${pdfPath}`);

        await browser.close();

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
})();

import { PDFOptions } from 'puppeteer-core';// @ts-ignore
import * as chromium from 'chrome-aws-lambda';
import {PDFInterface} from '../interfaces/PDF.interface';

export class PDF implements PDFInterface {

    /**
     * Get PDF from html template
     * @param urlToPdf
     * @param configuration
     */
     async getPdf(urlToPdf:string, configuration:PDFOptions = {}): Promise<Buffer> {
        let browser = null;

        try {
            browser = await chromium.puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath,
                headless: chromium.headless,
            });

            const page = await browser.newPage();
            await page.goto(urlToPdf, {
                waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
            });

            return await page.pdf(configuration);
        } catch (error) {
            throw new Error(`Failed to PDF: ${JSON.stringify(error)}`);
        } finally {
            if (browser !== null) {
                await browser.close();
            }
        }
    }
}

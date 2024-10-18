import { PDFOptions } from 'puppeteer-core';
export interface PDFInterface {
    getPdf(urlToPdf:string, configuration:PDFOptions):Promise<Buffer>;
}
import {HttpRequest} from '../HttpRequest.class';
import {OpenAIApi} from './OpenAI.api';
import FormData from 'form-data';

export type FileCreation = {
    purpose: 'fine-tune';
    file: Buffer;
};

export interface IFineTuneService {
    createFile(fileCreation: FileCreation): Promise<any>;
}

export type FineTuneCreation = {
    training_file: string;
};

export class FineTuneService extends OpenAIApi implements IFineTuneService {

    async createFile(fileCreation: FileCreation): Promise<any> {
        const form: FormData = new FormData();
        form.append('purpose', fileCreation.purpose);
        form.append('file', fileCreation.file, {filename: 'tuning.jsonl'});

        const request: HttpRequest = new HttpRequest('https://api.openai.com');
        return await request.post(form, 'v1/files', {
            'Authorization': `Bearer ${this.apiKey}`,
            ...form.getHeaders()
        });
    }

    async createFineTune(fineTuneCreation: FineTuneCreation) {
        const data: string = JSON.stringify(fineTuneCreation);

        const request: HttpRequest = new HttpRequest('https://api.openai.com');
        return await request.post(data, 'v1/fine-tunes', {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        });
    }
}

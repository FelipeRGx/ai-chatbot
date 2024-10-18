import FormData from 'form-data';
import {OpenAIApi} from './OpenAI.api';
import {HttpRequest} from '../HttpRequest.class';

export interface ITranscriptionService {
    createTranscription(file: Buffer, model?: string): Promise<any>;
}

export class TranscriptionService extends OpenAIApi implements ITranscriptionService {

    async createTranscription(file: Buffer, model: string = 'whisper-1'): Promise<any> {
        const form: FormData = new FormData();
        form.append('file', file, {filename: 'audio.ogg'});
        form.append('model', model);

        const request: HttpRequest = new HttpRequest(this.baseUrl);
        return await request.post(form, 'v1/audio/transcriptions', {
            'Authorization': `Bearer ${this.apiKey}`,
            ...form.getHeaders()
        });
    }
}

import {IEmbeddingService} from '../../interfaces/IProcessContext.interface';
import {HttpRequest} from '../HttpRequest.class';
import {StatusCodes} from 'http-status-codes';
import {Llama2Api} from "./Llama2.api";

export type EmbeddingCreation = {
    model: string;
    prompt: string;
};

export class EmbeddingService extends Llama2Api implements IEmbeddingService {

    async create(text: string): Promise<any> {
        console.log('Embeddings node');
        const MAX_TOKENS: number = 2500;
        let allEmbeddings: any[] = [];

        const chunks: string[] = this.countTokens(text) >= MAX_TOKENS ?
            this.chunkByTokens(text, MAX_TOKENS) : [text];

        for (let chunk of chunks) {
            const embedding = await this.sendForEmbedding(chunk);
            if (embedding?.status == StatusCodes.OK) {
                allEmbeddings.push(embedding.data.embedding);
            }
        }

        return {texts: chunks, embeddings: allEmbeddings}
    }

    private async sendForEmbedding(text: string): Promise<any> {
        const data: EmbeddingCreation = {
            model: `all-minilm:l6-v2`,
            prompt: text
        };

        const request: HttpRequest = new HttpRequest(this.baseUrl);
        return await request.post(data, 'api/embeddings', {
            'Content-Type': 'application/json'
        }, 5000);
    }

    private chunkByTokens(text: string, maxTokens: number): string[] {
        const chunks: string[] = [];
        let currentChunk: string = '';
        let currentTokens: number = 0;
        const potentialBreaks: string[] = text.split(/\s+|\.\s*|\n/);

        for (let part of potentialBreaks) {
            let additionalTokens: number = this.countTokens(part);

            if (currentTokens + additionalTokens <= maxTokens) {
                currentChunk += currentChunk ? ` ${part}` : part;
                currentTokens += additionalTokens;
            } else {
                chunks.push(currentChunk);
                currentChunk = part;
                currentTokens = additionalTokens;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }
}

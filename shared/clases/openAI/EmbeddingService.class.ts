import {IEmbeddingService} from '../../interfaces/IProcessContext.interface';
import {HttpRequest} from '../HttpRequest.class';
import {StatusCodes} from 'http-status-codes';
import {OpenAIApi} from "./OpenAI.api";

export type EmbeddingCreation = {
    model: string;
    input: string[];
};

export class EmbeddingService extends OpenAIApi implements IEmbeddingService {

    async create(text: string): Promise<any> {
        const MAX_TOKENS: number = 6191;
        let allEmbeddings: any[] = [];

        const chunks: string[] = this.countTokens(text) >= MAX_TOKENS ?
            this.chunkByTokens(text, MAX_TOKENS) : [text];

        for (let chunk of chunks) {
            const embedding = await this.sendForEmbedding(chunk);
            if (embedding?.status == StatusCodes.OK) {
                allEmbeddings.push(embedding.data.data[0].embedding);
            }
        }

        return {texts: chunks, embeddings: allEmbeddings}
    }

    private async sendForEmbedding(text: string): Promise<any> {
        const data: EmbeddingCreation = {
            model: `text-embedding-ada-002`,
            input: [text]
        };

        const request: HttpRequest = new HttpRequest('https://api.openai.com');
        return await request.post(data, 'v1/embeddings', {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        });
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

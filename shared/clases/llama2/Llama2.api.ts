import {encode} from 'gpt-3-encoder';

export class Llama2Api {
    constructor(protected readonly baseUrl: string, protected readonly apiKey: string) {}

    countTokens(text: string): number {
        return encode(text).length;
    }
}

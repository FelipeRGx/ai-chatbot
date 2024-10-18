import {CompletionInstruction, Message} from "../clases/openAI/CompletionService.class";

export interface IEmbeddingService {
    create(text: string): Promise<any>;
}

export interface ICompletionService {
    config: CompletionInstruction;
    create(messages: Array<Message>, onChunkReceived?: (chunk: any) => void): Promise<any>;
    answerQuestion(message: string, content: string, messages: Message[], onChunkReceived?: (chunk: any) => void): Promise<any>;
}

export interface IVectorService {
    upsert(indexName: string, upsertData: any, namespace: string): Promise<any>;
    search(embeddings: any[], namespaces: string, filter?: any, limit?: number): Promise<any>;
}

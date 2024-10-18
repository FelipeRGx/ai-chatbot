import {HttpRequest} from '../HttpRequest.class';
import {OpenAIApi} from './OpenAI.api';

export interface IAssistantService {
    createThread(): Promise<any>;
    runAssistant(threadId: string, data: any): Promise<any>;
    checkRunStatus(threadId: string, runId: string): Promise<any>;
    addMessageToThread(threadId: string, message: any): Promise<any>;
    createAssistant(model: string, instruction: string): Promise<any>;
    getAssistantResponse(threadId: string, runId: string): Promise<any>;
}

type Role = 'system' | 'user' | 'assistant';

export interface Message {
    role: Role;
    content: string;
}

export class AssistantService extends OpenAIApi implements IAssistantService {

    private headers(): any {
        return {
            'OpenAI-Beta': 'assistants=v1',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }

    private getHeaders(): any {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'OpenAI-Beta': 'assistants=v1'
        };
    }

    async createAssistant(model: string, instruction: string): Promise<any> {
        const data = {
            name: 'test',
            model: model,
            instructions: instruction,
            tools: [{'type': 'code_interpreter'}]
        };

        return await new HttpRequest(this.baseUrl).post(data, 'assistants', this.headers());
    }

    async createThread(): Promise<any> {
        return await new HttpRequest(this.baseUrl).post({}, `threads`, this.headers());
    }

    async addMessageToThread(threadId: string, message: Message): Promise<any> {
        return await new HttpRequest(this.baseUrl).post(message, `threads/${threadId}/messages`, this.headers());
    }

    async runAssistant(threadId: string, data: any): Promise<any> {
        return await new HttpRequest(this.baseUrl).post(data, `threads/${threadId}/runs`, this.headers());
    }

    async checkRunStatus(threadId: string, runId: string): Promise<any> {
        return await new HttpRequest(this.baseUrl).get(`threads/${threadId}/runs/${runId}`, {}, this.getHeaders());
    }

    async getAssistantResponse(threadId: string): Promise<any> {
        return await new HttpRequest(this.baseUrl).get(`threads/${threadId}/messages`, {}, this.headers());
    }
}

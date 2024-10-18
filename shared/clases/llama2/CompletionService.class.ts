import {ICompletionService} from '../../interfaces/IProcessContext.interface';
import {HttpRequest} from '../HttpRequest.class';
import {Llama2Api} from './Llama2.api';
import {AxiosResponse} from 'axios';

type Role = 'system' | 'user' | 'assistant';

export interface Message {
    role: Role;
    content: string;
    images?: string[];
}

export interface CompletionInstruction {
    n?: number;
    context?: any;
    options?: any;
    top_p?: number;
    model?: string;
    format?: string;
    streaming?: boolean;
    max_tokens?: number;
    temperature?: number;
    presence_penalty?: number;
    frequency_penalty?: number;

    domainTopic?: string;
    specialist?: string;
    timePeriod?: string;
    businessName?: string;
    knowledgeDepth?: string;
    fallbackResponse?: string;
    sourcePreference?: string;
    communicationStyle?: string;
    ethicalLimitations?: string[];
}

export class CompletionService extends Llama2Api implements ICompletionService {
    public config: CompletionInstruction = {};

    chunkContentIfNeeded(content: string, maxTokens: number) {
        if (this.countTokens(content) <= maxTokens) {
            return [content];
        }

        let parts: string[] = [];
        let currentPart: string = '';
        let words: string[] = content.split(' ');

        for (let word of words) {
            let potentialPart = currentPart + ' ' + word;
            if (this.countTokens(potentialPart) <= maxTokens) {
                currentPart = potentialPart;
            } else {
                parts.push(currentPart);
                currentPart = word;
            }
        }

        if (currentPart) {
            parts.push(currentPart);
        }

        return parts;
    }

    async create(messages: Message[], onChunkReceived: (chunk: any) => void): Promise<any> {
        console.log('Llama2 node');
        const instruction: CompletionInstruction = this.config;

        const body: any = {
            temperature: 0.3,
            messages: messages,
            presence_penalty: 0,
            frequency_penalty: 0,
            stream: instruction.streaming
        };

        let headers: any = {
            'Content-Type': 'application/json'
        };

        console.log('LLM request', body);
        const request: HttpRequest = new HttpRequest(this.baseUrl, instruction.streaming ? 'stream' : '');
        const response: AxiosResponse<any, any> = await request.post(body, 'v1/chat/completions', headers);

        if (instruction.streaming) {
            return new Promise((resolve, reject) => {
                let result = '';
                response.data.on('data', (chunk: any) => {
                    const lines = chunk
                        ?.toString()
                        ?.split('\n')
                        .filter((line: string) => line.trim() !== '');
                    for (const line of lines) {
                        const message = line.replace(/^data: /, '');

                        if (message == '[DONE]') {
                            onChunkReceived('\n\n[DONE]\n\n');
                        } else {
                            let token;

                            try {
                                token = JSON.parse(message)?.choices?.[0]?.delta?.content || '';
                            } catch {
                                token = '';
                            }

                            result += token;
                            if (token) {
                                onChunkReceived(token);
                            }
                        }
                    }
                });

                response.data.on('end', () => {
                    resolve({});
                });
                response.data.on('error', (error: any) => {
                    reject(error);
                });
            });
        }

        return response;
    }

    async answerQuestion(message: string, content: string, messages: Message[], onChunkReceived: (chunk: any) => void): Promise<any> {
        const {
            domainTopic = '',
            specialist = '',
            businessName = '',
            communicationStyle = '',
            fallbackResponse = 'Lo siento, no tengo información sobre eso.',
        } = this.config;

        await this.create([
            {
                role: 'system',
                content: `
                    Eres un asistente especializado en ${specialist} de la organización ${businessName}, y tu dominio es exclusivamente ${domainTopic}.
                    Tu estilo de comunicación es ${communicationStyle}, Debes preferir fuentes verificables.
                    Siempre responde a saludos, despedidas, cumplidos y preguntas estrictamente relacionadas con el contenido: '${content}'.
                    No te desvíes hacia áreas diferentes a ${specialist} y no respondas a preguntas generales o triviales que no estén relacionadas con ${domainTopic}.
                    Si una pregunta se aleja de tu especialización ${specialist}, requiere conocimientos, 
                    habilidades adicionales, te genera dudas o no está relacionada con el contenido, usa la frase: '${fallbackResponse}', pero siempre intenta dar una solucion.
                    Recuerda responder en primera persona o en nombre de la organización cuando sea pertinente, manteniendo siempre el contexto estricto de tu especialización y contenido indicado.
                    NO TE SALGAS DEL CONTENIDO, TEMAS O ESPECIALIZACIÓN INDICADA.
                    
                    Sí el usuario solicita crear o generar una solicitud, gestión, o pregunte como crear una solicitud o gestión, el asistente debe responsder siempre únicamente con el texto "{T_S}". Por ejemplo si el cliente pregunta "Quiero crear una solicitud" responde "{T_S}". Si el cliente necesita ayuda, o necesita gestionar algun servicio el asistente debe sugerir de la forma mas corta crear una solicitud
                `
            },
            ...messages,
            {
                role: `user`,
                content: message,
            }
        ], onChunkReceived);
    }
}

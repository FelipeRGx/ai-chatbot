import {ICompletionService} from '../../interfaces/IProcessContext.interface';
import {HttpRequest} from '../HttpRequest.class';
import {OpenAIApi} from "./OpenAI.api";
import {Queue} from "../Queue.class";
import {AxiosResponse} from "axios";
import * as _ from 'lodash';

type Role = 'system' | 'user' | 'assistant';

export interface Message {
    role: Role;
    content: string;
}

export interface CompletionInstruction {
    n?: number;
    messages: any;
    top_p?: number;
    model?: string;
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

export class CompletionService extends OpenAIApi implements ICompletionService {
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

    async sendMail(params: any) {
        try {
            await Queue.notification([{
                'to': [
                    params.to
                ],
                'from': 'henmanuelvargas@creai.mx',
                'data': {
                    'TXT': params.body || 'Cotización enviada, revisa el grupo en signal'
                },
                'templateName': 'simpleTXT',
                'subject': params.subject || 'Envío de cotización'
            }], 'email', 'SES')

            return '\n\nMe confirma recibido'
        } catch (e: any) {
            return '';
        }
    }

    async trackPackage(params: any): Promise<string> {
        try {
            const request = new HttpRequest('https://lho6n6m4d1.execute-api.us-east-1.amazonaws.com/Stage/trackingNumberGet');
            const response = await request.post(params);
            let message = 'No encuentro envío con ese número, por favor revisa que el número sea el correcto';

            if (response.status === 201) {
                let status = 'Pendiente';
                switch (response.data.status) {
                    case 1:
                        status = 'Entregado';
                        break;
                    case 2:
                        status = 'Cancelado';
                        break;
                }

                message = `El envío con el número: ${response.data.number} se encuentra ${status}`;
                if (response.data.note) {
                    message += `. Nota: ${response.data.note}`;
                }
            }

            return message;
        } catch (e: any) {
            console.error('Error tracking package:', e);
            return 'Hubo un error al intentar rastrear el paquete. Por favor, inténtalo de nuevo más tarde.';
        }
    }

    async cancelTrackPackage(params: any): Promise<string> {
        try {
            const request = new HttpRequest('https://lho6n6m4d1.execute-api.us-east-1.amazonaws.com/Stage/trackingNumber');
            const response = await request.put('', params);
            let message = 'No encuentro envío con ese número, por favor revisa que el número sea el correcto';

            if (response.status === 201) {
                message = `El envío con el número: ${params.number} se ha cancelado`;
                if (params?.note) {
                    message += `. Nota: ${params.note}`;
                }
            }

            return message;
        } catch (e: any) {
            console.error('Error tracking package:', e);
            return 'Hubo un error al intentar cancelar el paquete. Por favor, inténtalo de nuevo más tarde.';
        }
    }


    async create(messages: Message[], onChunkReceived: (chunk: any) => void): Promise<any> {
        const instruction: CompletionInstruction = this.config

        const toolsData = [
            {
                "type": "function",
                "function": {
                    "name": "send_email",
                    "description": "Send an email with the specified subject, recipient, and body containing details.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "to": {
                                "type": "string",
                                "description": "The recipient's email address."
                            },
                            "subject": {
                                "type": "string",
                                "description": "The subject of the email."
                            },
                            "body": {
                                "type": "string",
                                "description": "The body content of the email with HTML tags."
                            }
                        },
                        "required": ["to", "subject", "body"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "track_package",
                    "description": "Retrieve the tracking information for a given tracking number.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "number": {
                                "type": "string",
                                "description": "The tracking number of the package."
                            }
                        },
                        "required": ["number"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "cancel_tracking",
                    "description": "Cancel the tracking of a package for a given tracking number.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "number": {
                                "type": "string",
                                "description": "The tracking number of the package."
                            },
                            "status": {
                                "type": "integer",
                                "description": "Action to be performed. Send 2 to cancel the tracking.",
                                "enum": [2]
                            },
                            "note": {
                                "type": "string",
                                "description": "The reason for canceling the tracking."
                            }
                        },
                        "required": ["number", "status", "note"]
                    }
                }
            }
        ];

        const body: any = {
            stream: true,
            n: instruction.n,
            tools: toolsData,
            tool_choice: 'auto',
            top_p: instruction.top_p,
            model: instruction.model,
            messages: instruction.messages,
            max_tokens: instruction.max_tokens,
            temperature: instruction.temperature,
            presence_penalty: instruction.presence_penalty,
            frequency_penalty: instruction.frequency_penalty
        };

        let headers: any = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };

        console.log('LLM Request', body);
        const request: HttpRequest = new HttpRequest(this.baseUrl, instruction.streaming ? 'stream' : '');
        const response: AxiosResponse<any, any> = await request.post(body, 'v1/chat/completions', headers);

        if (instruction.streaming) {
            return new Promise((resolve, reject) => {
                let toolArguments: string = '';
                let messageBuffer: any = '';
                let result: string = '';
                let object: any = {};

                response.data.on('data', async (chunk: any) => {
                    const lines = chunk?.toString()?.split('\n').filter((line: string) => line.trim() !== '');

                    for (const line of lines) {
                        try {
                            messageBuffer += line.replace(/^data: /, '');
                            object = _.merge({}, object, JSON.parse(messageBuffer));

                            if (object.choices[0].finish_reason == 'stop') {
                                onChunkReceived('\n\n[DONE]\n\n');
                                resolve({});
                                return;
                            }

                            if (object?.choices[0]?.delta?.tool_calls) {
                                for (const call of object.choices[0].delta.tool_calls) {
                                    let parsedArguments: any;

                                    try {
                                        toolArguments += call.function.arguments;
                                        object.choices[0].delta.tool_calls[0].function.arguments = toolArguments;

                                        parsedArguments = JSON.parse(toolArguments);
                                        instruction.messages.push(object?.choices[0]?.delta);
                                        let functionResponse: any;
                                        switch (object.choices[0].delta.tool_calls[0].function.name) {
                                            case 'send_email':
                                                functionResponse = await this.sendMail(parsedArguments);
                                                break;
                                            case 'track_package':
                                                functionResponse = await this.trackPackage(parsedArguments);
                                                break;
                                            case 'cancel_tracking':
                                                functionResponse = await this.cancelTrackPackage(parsedArguments);
                                                break;
                                            default:
                                                functionResponse = {
                                                    data: 'function not found'
                                                }
                                        }

                                        instruction.messages.push({
                                            role: 'tool',
                                            content: functionResponse.toString(),
                                            tool_call_id: object.choices[0].delta.tool_calls[0].id,
                                            name: object.choices[0].delta.tool_calls[0].function.name
                                        });

                                        await this.create(instruction, onChunkReceived);
                                    } catch {}
                                }
                            } else {
                                const token = object?.choices[0]?.delta?.content || '';
                                result += token;
                                if (token) {
                                    onChunkReceived(token);
                                }
                            }

                            messageBuffer = '';
                        } catch (e) {}
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

        onChunkReceived(response.data.choices[0].messages);
        return response;
    }

    async answerQuestion(message: string, content: string, messages: Message[], onChunkReceived: (chunk: any) => void): Promise<any> {
        const {
            n = 1,
            top_p = 1,
            streaming = false,
            max_tokens = 2000,
            temperature = 0.5,
            presence_penalty = 0,
            frequency_penalty = 0,
            model = 'gpt-3.5-turbo',

            domainTopic = '',
            specialist = '',
            timePeriod = '',
            businessName = '',
            knowledgeDepth = '',
            sourcePreference = '',
            communicationStyle = '',
            ethicalLimitations = [],
            fallbackResponse = 'Lo siento, no tengo información sobre eso.',
        } = this.config;

        const contextResponse = await this.create({
            n,
            top_p,
            model,
            streaming,
            max_tokens,
            temperature,
            presence_penalty,
            frequency_penalty,
            messages: [
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
                `
                },
                ...messages,
                {
                    role: `user`,
                    content: message,
                }
            ]
        }, onChunkReceived);
    }
}

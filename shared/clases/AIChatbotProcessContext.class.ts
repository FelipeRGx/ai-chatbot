import { ICompletionService, IEmbeddingService, IVectorService } from '../interfaces/IProcessContext.interface';
import { MessageFromQueueI, MessageI, MessageModel } from '../../Messages/domain/Message.model';
import { ConversationModel } from '../../Messages/domain/Conversation.model';
import { PineconeConnection, VectorService } from './Pinecone.class';
import { ChatbotI } from '../../Chatbot/domain/Chatbot.model';
import {ChannelManager} from './ChannelManager.class';
import { PIISanitizer } from './PIISanitizer.class';
import { Queue } from './aws/AWSQueueService.class';
import { LLMHandler } from './LLM.conector';
import { Utils } from './Utils.class';

export class AIChatbotProcessContext {
    private finalAnswer: string = '';
    private piiSanitizer: PIISanitizer;
    private vectorService: IVectorService;
    private finalMessages: MessageI[] = [];
    private embeddingService: IEmbeddingService;
    private completionService: ICompletionService;

    constructor(
        private readonly body: MessageFromQueueI,
        private readonly chatbot: ChatbotI
    ) {
        this.finalMessages = [{
            senderId: 'user',
            text: this.body.message,
            id: Utils.generateUUID()
        }];

        const dbConnection: PineconeConnection = new PineconeConnection(
            this.chatbot?.pineconeConfig?.apiKey || '',
            this.chatbot?.pineconeConfig?.environment || '',
            this.chatbot?.pineconeConfig?.projectId || ''
        );

        const llmHandler: LLMHandler = new LLMHandler('https://api.openai.com', this.chatbot?.openAIConfig?.api_key || '');
        const vectorService: VectorService = new VectorService(dbConnection, this.chatbot?.pineconeConfig?.indexName || '');

        const embeddingService: IEmbeddingService = llmHandler.getEmbeddingService();
        const completionService: ICompletionService = llmHandler.getCompletionService({
            temperature: 0.7,
            specialist: this.chatbot.specialist,
            timePeriod: this.chatbot.timePeriod,
            domainTopic: this.chatbot.domainTopic,
            businessName: this.chatbot.businessName,
            knowledgeDepth: this.chatbot.knowledgeDepth,
            fallbackResponse: this.chatbot.fallbackResponse,
            sourcePreference: this.chatbot.sourcePreference,
            communicationStyle: this.chatbot.communicationStyle,
            ethicalLimitations: ['Política', 'Religión']
        });

        this.vectorService = vectorService;
        this.piiSanitizer = new PIISanitizer();
        this.embeddingService = embeddingService;
        this.completionService = completionService;
    }

    async queue(message: string, chatbotId: string, channelId: string, product: string): Promise<any> {
        if (message) {
            const send = await Queue.send({
                channelId,
                chatbotId,
                product,
                message
            });

            if (send.MessageId) {
                console.log('AWSQueueService Response', send);
            }

            return send;
        }

        return {};
    }

    async question(body: MessageFromQueueI): Promise<void> {
        console.log('message', body.message);

        if (body.message) {
            const dbMessageConnection: PineconeConnection = new PineconeConnection(
                this.chatbot?.pineconeConfig?.apiKey || '',
                this.chatbot?.pineconeConfig?.environment || '',
                this.chatbot?.pineconeConfig?.projectId || ''
            );

            const lastMessages: MessageModel = new MessageModel({
                channelId: body.channelId,
                chatbotId: body.chatbotId
            });

            const lastMessagesResults = await lastMessages.findLast(32);
            const contentEmbeddings = await this.embeddingService.create(body.message);
            const vectorUserResults = await this.vectorService.search(contentEmbeddings.embeddings, this.chatbot?.pineconeConfig?.namespace || '');
            const CONTENT = vectorUserResults.data.matches.map((match: {
                metadata: { data: string; };
            }) => match.metadata.data).join('. ') || '';
            console.log('CONTENT', CONTENT);

            const userEmbeddings = await this.embeddingService.create(body.message);
            const vectorMessageService: VectorService = new VectorService(dbMessageConnection, this.chatbot?.pineconeConfig?.indexName || '');
            const vectorMessagesResults = await vectorMessageService.search(userEmbeddings.embeddings, 'messages', {
                '$and': [
                    {'chatbotId': {'$eq': body.chatbotId}},
                    {'channelId': {'$eq': body.channelId}}
                ]
            }, 32);

            const filteredVectorMessages = vectorMessagesResults.data.matches.filter((message: MessageModel) => {
                return !lastMessagesResults?.Items.some((current: { id: string; }) => current.id === message.id);
            });

            const vectorMessages = filteredVectorMessages.map((message: any) => {
                return {
                    createdAt: message.metadata.createdAt,
                    content: message.metadata.content,
                    role: message.metadata.role
                }
            });

            const dynamoMessages: any = lastMessagesResults?.Items.map((message: MessageModel) => {
                return {
                    createdAt: message.createdAt,
                    content: message.content,
                    role: message.senderId
                }
            });

            const concatMessages = [].concat(dynamoMessages);//vectorMessages.concat(dynamoMessages);
            const messages = concatMessages.sort((a: any, b: any) => {
                return a.createdAt - b.createdAt;
            });

            const redactedText: string = this.piiSanitizer.redact(body.message);
            messages.forEach((obj: { [x: string]: any; }) => {
                obj.content = this.piiSanitizer.redact(obj.content);
                delete obj['createdAt'];
            });

            await this.completionService.answerQuestion(redactedText, CONTENT, messages, this.answer());
        }
    }

    answer():(chunk: any) => Promise<void> {
        const self = this;
        return async (chunk): Promise<void> => {
            self.finalAnswer += chunk.toString();
            const excerpts: string[] = self.finalAnswer.split('\n\n');

            if (excerpts.length > 1) {
                const channel: ChannelManager = new ChannelManager(self.body, this.chatbot);
                self.finalAnswer = self.finalAnswer.replace(this.piiSanitizer.restore(excerpts[0] || ''), '').replace(/\n\n/g, '');
                self.finalMessages = await channel.response(this.piiSanitizer.restore(excerpts[0] || ''), self.finalMessages);

                if (excerpts[1] === '[DONE]') {
                    for (let answer of self.finalMessages) {
                        let message: string = answer.text || '';
                        const matches: any = message.match(/data:([a-zA-Z0-9\/]+);base64,([A-Za-z0-9+/=]+)/);

                        if (matches && matches.length > 0) {
                            const mimeType: string = matches[1];
                            const base64String: string = matches[0];
                            const extension: string = mimeType.split('/')[1];
                            message = message.replace(base64String || '', ` [file.${extension}]`);
                        }

                        const restoredResponse: string = this.piiSanitizer.restore(message || '');
                        const embeddingsResponse = await this.embeddingService.create(restoredResponse || '');

                        console.log('embeddingsResponse', embeddingsResponse);
                        for (const current in embeddingsResponse.texts) {
                            const messageAnswer: MessageModel = new MessageModel({
                                id: answer.id,
                                status: 'sent',
                                type: self.body.mediaType,
                                content: restoredResponse,
                                senderId: answer.senderId,
                                chatbotId: self.body.chatbotId,
                                channelId: self.body.channelId
                            });

                            const vectorSave: any = await this.vectorService.upsert(this.chatbot.pineconeConfig?.indexName || '', [{
                                metadata: {
                                    chatbotId: self.body.chatbotId,
                                    channelId: self.body.channelId,
                                    role: messageAnswer.senderId,
                                    createdAt: messageAnswer.createdAt,
                                    content: embeddingsResponse.texts[current]
                                },
                                id: messageAnswer.id,
                                values: embeddingsResponse.embeddings[current]
                            }], 'messages');

                            console.log('vectorSave', vectorSave);
                            await messageAnswer.save();
                        }
                    }

                    const conversation: ConversationModel = new ConversationModel({
                        id: self.body.channelId,
                        channel: self.body.product,
                        lastMessage: Utils.nowTimeStamp()
                    });

                    await conversation.save();
                }
            }
        }
    }
}

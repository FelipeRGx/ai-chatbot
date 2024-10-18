import {startOfDay, endOfDay} from 'date-fns';
import {DB} from '../../shared/clases/DB.class';
import {Utils} from '../../shared/clases/Utils.class';
import {AWSDynamoService} from '../../shared/clases/aws/AWSDynamoService.class';
import {IsInt, IsNotEmpty, IsString, ValidateNested, IsEnum, IsObject} from 'class-validator';

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    AUDIO = 'audio',
    VIDEO = 'video',
    DOCUMENT = 'document'
}

export interface MessageFromQueueI {
    message: string;
    channelId: string;
    chatbotId: string;
    mediaType: MessageType;
    product: 'whatsapp_business_account' | 'page' | 'instagram' | 'signal';
}

export interface MessageI {
    id: string;
    text?: string;
    status?: string;
    content?: string;
    language?: string;
    senderId?: string;
    chatbotId?: string;
    channelId?: string;
    createdAt?: number;
    type?: MessageType;
    attachments?: any[];
    payload?: any;
}

export class MessageModel extends DB<any, any> implements MessageI {
    @IsString()
    @IsNotEmpty()
    readonly id: string;

    @IsString()
    @IsNotEmpty()
    readonly chatbotId: string;

    @IsString()
    @IsNotEmpty()
    readonly channelId: string;

    @IsInt()
    @IsNotEmpty()
    readonly createdAt: number;

    @IsString()
    @IsNotEmpty()
    readonly senderId: string;

    @IsEnum(MessageType)
    @IsNotEmpty()
    readonly type: MessageType;

    @IsString()
    @IsNotEmpty()
    readonly content: string;

    @IsString()
    @IsNotEmpty()
    readonly status: string;

    @IsString()
    @IsNotEmpty()
    readonly language: string;

    @ValidateNested()
    attachments?: any[];

    @IsNotEmpty()
    @IsObject()
    payload: object;

    constructor(
        message: Partial<MessageI>
    ) {
        super(new AWSDynamoService());

        this.id = message.id || '0';
        this.content = message.content || '';
        this.senderId = message.senderId || '';
        this.status = message.status || 'sent';
        this.channelId = message.channelId || '';
        this.chatbotId = message.chatbotId || '';
        this.language = message.language || 'es';
        this.type = message.type || MessageType.TEXT;
        this.attachments = message.attachments || [];
        this.createdAt = message.createdAt || Utils.nowTimeStamp();

        this.payload = message.payload || {};
    }

    save(): Promise<any> {
        return super.save({
            TableName: process.env.MESSAGE_TABLE || '',
            Item: this.toJSON()
        }, this);
    }

    toJSON(): any {
        return {
            id: this.id,
            type: this.type,
            status: this.status,
            content: this.content,
            senderId: this.senderId,
            language: this.language,
            channelId: this.channelId,
            chatbotId: this.chatbotId,
            createdAt: this.createdAt,
            attachments: this.attachments,
            payload: this.payload
        };
    }

    async findOne(): Promise<MessageModel> {
        let message = await super.findOne({
            TableName: process.env.MESSAGE_TABLE || '',
            Key: { id: this.id }
        });

        message = message.Item || { id: '0' };
        console.log('message found', message.id);
        return new MessageModel(message);
    }

    delete(): Promise<any> {
        return super.delete({
            TableName: process.env.MESSAGE_TABLE || '',
            Key: { id: this.id }
        });
    }

    async findLast(limit: number): Promise<any> {
        return super.query({
            page: 0,
            limit: limit,
            params: {
                chatbotId: this.chatbotId,
                channelId: this.channelId
            },
            indexName: 'chatbotIdAndChannelId',
            tableName: process.env.MESSAGE_TABLE || '',
        });
    }

    async countInteractionsByChatbotId(chatbotId: string, senderId: string): Promise<number> {
        const dynamoService: AWSDynamoService = new AWSDynamoService();
        const TableName: string = process.env.MESSAGE_TABLE || '';
        const IndexName: string = 'ChatbotIdAndSenderId';

        const now: Date = new Date();
        const startOfToday: number = startOfDay(now).getTime();
        const endOfToday: number = endOfDay(now).getTime();

        let totalInteractions: number = 0;
        let lastEvaluatedKey = null;

        do {
            const params = {
                tableName: TableName,
                indexName: IndexName,
                page: lastEvaluatedKey,
                params: {
                    chatbotId: chatbotId,
                    senderId: senderId
                },
                filterExpression: "createdAt BETWEEN :startDay AND :endDay",
                expressionAttributeValues: {
                    ":startDay": startOfToday,
                    ":endDay": endOfToday
                }
            };

            const data = await dynamoService.query(params);
            lastEvaluatedKey = data.LastEvaluatedKey;
            totalInteractions += data.Items.length;

        } while (lastEvaluatedKey);

        return totalInteractions;
    }

    async calculateAverageConversationDuration(chatbotId: string): Promise<number> {
        const inactivityHours: number = 2;
        const TableName: string = process.env.MESSAGE_TABLE || '';
        const dynamoService: AWSDynamoService = new AWSDynamoService();
        const maxInactivityPeriod: number = inactivityHours * 60 * 60 * 1000;

        const now: Date = new Date();
        const startOfToday: number = startOfDay(now).getTime();
        const endOfToday: number = endOfDay(now).getTime();

        let lastEvaluatedKey = null;
        let totalDuration: number = 0;
        let conversationCount: number = 0;
        let lastMessageTime: number | null = null;
        let conversationStart: number | null = null;

        do {
            const params = {
                tableName: TableName,
                page: lastEvaluatedKey,
                indexName: 'chatbotIdAndCreatedAt',
                params: {
                    chatbotId: chatbotId
                },
                filterExpression: "createdAt BETWEEN :startDay AND :endDay",
                expressionAttributeValues: {
                    ":startDay": startOfToday,
                    ":endDay": endOfToday
                }
            };

            const data = await dynamoService.query(params);
            lastEvaluatedKey = data.LastEvaluatedKey;

            for (const message of data.Items) {
                const messageTime = message.createdAt;

                if (lastMessageTime === null || (messageTime - lastMessageTime) > maxInactivityPeriod) {
                    if (lastMessageTime !== null) {
                        totalDuration += lastMessageTime - (conversationStart ?? lastMessageTime);
                        conversationCount++;
                    }

                    conversationStart = messageTime;
                }

                lastMessageTime = messageTime;
            }

        } while (lastEvaluatedKey);

        if (conversationStart !== null && lastMessageTime !== null) {
            totalDuration += lastMessageTime - conversationStart;
            conversationCount++;
        }

        return conversationCount > 0 ? totalDuration / conversationCount : 0;
    }
}

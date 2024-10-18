import {DB} from 'shared/clases/DB.class';
import {IsNotEmpty, IsNumber, IsString} from 'class-validator';
import {AWSDynamoService} from 'shared/clases/aws/AWSDynamoService.class';

interface ConversationI {
    id?: string,
    channel?: string,
    lastMessage?: number
}

export class ConversationModel extends DB<any, any> implements ConversationI {
    @IsString()
    @IsNotEmpty()
    readonly id: string;

    @IsString()
    @IsNotEmpty()
    readonly channel: string;

    @IsNumber()
    @IsNotEmpty()
    readonly lastMessage: number;

    constructor(
        conversation: ConversationI
    ) {
        super(new AWSDynamoService());

        this.id = conversation.id || '0';
        this.channel = conversation.channel || '';
        this.lastMessage = conversation.lastMessage || 0;
    }

    save(): Promise<any> {
        return super.save({
            TableName: process.env.CONVERSATION_TABLE || '',
            Item: {
                id: this.id,
                channel: this.channel,
                lastMessage: this.lastMessage
            }
        }, this);
    }

    async findOne(): Promise<ConversationModel> {
        let conversation = await super.findOne({
            TableName: process.env.CONVERSATION_TABLE || '',
            Key: {
                id: this.id
            }
        });

        conversation = conversation.Item || {id: '0'};
        console.log('conversation found', conversation.id);
        return new ConversationModel(conversation);
    }

    async findPaginated(lastEvaluatedKey: any, limit: number = 20): Promise<any> {
        const params = {
            tableName: process.env.CONVERSATION_TABLE || '',
            indexName: 'lastMessage', // Asegúrate de que este índice exista en tu tabla DynamoDB
            params: {
                // Aquí necesitas definir cómo filtrar tus ítems si es necesario, por ejemplo, por channelId
            },
            limit: limit,
            page: lastEvaluatedKey
        };

        return super.query(params);
    }
}

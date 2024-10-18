import {StatusCodes} from 'http-status-codes';
import {Utils} from 'shared/clases/Utils.class';
import {ConversationModel} from "../../domain/Conversation.model";

exports.handler = async (event: any, context: any, callback: any): Promise<void> => {
    try {
        console.log('event', event);
        const body = Utils.objected(event.body);

        const lastEvaluatedKey = body.lastEvaluatedKey ? JSON.parse(body.lastEvaluatedKey) : null;
        const limit: number = 20;

        const conversationModel: ConversationModel = new ConversationModel({});
        const result = await conversationModel.findPaginated(lastEvaluatedKey, limit);

        callback(null, {
            body: JSON.stringify({
                conversations: result.Items,
                lastEvaluatedKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : null
            }),
            statusCode: StatusCodes.OK
        });
    } catch (error) {
        console.error('Error:', error);

        callback(null, {
            body: JSON.stringify({ message: 'Internal Server Error' }),
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR
        });
    }
};

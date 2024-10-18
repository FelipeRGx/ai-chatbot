import {Utils} from 'shared/clases/Utils.class';
import {StatusCodes} from 'http-status-codes';

exports.handler = async (event: any, context: any, callback: any): Promise<void> => {
    try {
        console.log('event', event);
        const body = Utils.objected(event.body);

        //logica aqui

        callback(null, {
            body: JSON.stringify({message: 'ok'}),
            statusCode: StatusCodes.CREATED
        });
    } catch (error) {
        console.error(error);

        callback(null, {
            body: 'Internal Server Error',
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR
        });
    }
};

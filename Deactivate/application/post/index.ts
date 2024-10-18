import {StatusCodes} from 'http-status-codes';

exports.handler = async (event: any, context: any, callback: any): Promise<void> => {
    try {
        if(parseInt(`${process.env.DEACTIVATE}` || '0')) {
            callback(null, {
                body: JSON.stringify({message: 'deactivator'}),
                statusCode: StatusCodes.CREATED
            });
        } else {
            callback(null, {
                body: 'Internal Server Error',
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR
            });
        }
    } catch (error) {
        console.error(error);

        callback(null, {
            body: 'Internal Server Error',
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR
        });
    }
};

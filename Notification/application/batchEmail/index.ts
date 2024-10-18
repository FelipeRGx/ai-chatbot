import * as HttpStatus from 'http-status-codes';
import {Utils} from 'shared/clases/Utils.class';
import {Queue} from 'shared/clases/Queue.class';
import {EmailI} from 'shared/interfaces/Email.interface';
import {ResponseI} from 'shared/interfaces/Response.interface';

exports.handler = async (event: any, context: any, callback: any): Promise<void> => {
    console.log('Event', event);

    let response:ResponseI = {
        statusCode: HttpStatus.BAD_REQUEST
    };

    try {
        const emails:EmailI[] = Utils.objected(event.body);
        const responseEmail: string[] = await Queue.notification(emails, 'email', 'SES');

        if (Object.keys(responseEmail).length) {
            response.statusCode = HttpStatus.CREATED;
        }

    } catch (e) {
        console.log('Error', e);
        response.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    console.log('Response', response);
    callback(null, response);
}

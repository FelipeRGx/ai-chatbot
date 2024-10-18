import {SES} from 'aws-sdk';
import {SQSEvent, SQSRecord} from 'aws-lambda';
import * as HttpStatus from 'http-status-codes';
import {Utils} from 'shared/clases/Utils.class';
import {Email} from 'shared/clases/Email.class';
import {EmailI} from 'shared/interfaces/Email.interface';
import {ResponseI} from 'shared/interfaces/Response.interface';
import {NotificationModel} from '../../domain/Notification.model';

import emailTemplates from './templates';
process.env['EMAIL_TEMPLATES'] = JSON.stringify(emailTemplates);

exports.handler = async (event: any, context: any, callback: any): Promise<void> => {
    console.log('Event', event);

    let response:ResponseI = {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST
    };

    try {
        const current:SQSEvent = Utils.objected(event);
        const records:SQSRecord[] = current.Records;

        for (const current in records) {
            if (records.hasOwnProperty(current)) {
                if (records[current].hasOwnProperty('body')) {
                    const body:EmailI = Utils.objected(records[current].body);
                    const send: SES.SendEmailResponse = await Email.send(body);

                    if (send.MessageId) {
                        if (body.hasOwnProperty('notificationId')) {
                            let notify: NotificationModel = new NotificationModel({
                                id: body.notificationId
                            });

                            const currentNotify: NotificationModel | false = await notify.findOne();

                            if (currentNotify) {
                                currentNotify.send = true;
                                currentNotify.providerResponse = send;
                                await currentNotify.save();
                            }
                        }
                    }
                }
            }
        }

        response.success = true;
        response.statusCode = HttpStatus.CREATED;
    } catch (e) {
        console.log('Error', e);
        response.body = e;
        response.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    callback(null, response);
}

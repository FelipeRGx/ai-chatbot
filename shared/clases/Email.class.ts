import {Utils} from './Utils.class';
import {EmailI} from '../interfaces/Email.interface';
import {SESClient, SendEmailCommand} from '@aws-sdk/client-ses';

export class Email {

    private static sesClient: SESClient = new SESClient({ region: process.env.AWS_REGION });

    /**
     * Send bean mail
     * @param bean
     */
    static async send(bean: EmailI): Promise<any> {
        const {
            to,
            from,
            data,
            replyTo,
            subject,
            templateName
        } = bean;

        const htmlBody:string = this.makeTemplate(templateName, data);

        const sesParams = {
            Destination: {
                ToAddresses: to,
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: htmlBody,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            ReplyToAddresses: replyTo,
            Source: from
        };

        try {
            const sendingAccountType = await this.sesClient.send(new SendEmailCommand(sesParams));
            console.log('SES Response', JSON.stringify(sendingAccountType));
            return sendingAccountType;
        } catch (error) {
            console.error('Error sending SES email:', error);
            throw error;
        }
    };

    /**
     * Get and set current data in email template
     * @param templateName
     * @param data
     */
    static makeTemplate (templateName:string, data:object):string {
        const emailTemplates = Utils.objected(process.env['EMAIL_TEMPLATES']);
        if (emailTemplates.hasOwnProperty(templateName)) {
            return Utils.replacementValues(emailTemplates[templateName], data);
        }

        throw new Error('Template not found');
    }
}

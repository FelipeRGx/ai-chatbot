import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {NotificationModel} from '../../Notification/domain/Notification.model';

export class Queue {
    private static sqsClient = new SQSClient({ region: process.env.AWS_REGION });

    /**
     * Send current queue message
     * @param body
     * @param delayInSeconds
     */
    static async send(body: object, delayInSeconds: number) {
        const params = {
            DelaySeconds: delayInSeconds,
            MessageBody: JSON.stringify(body),
            QueueUrl: process.env.QUEUE_URL || ''
        };

        console.log('Queue Request', params);
        const send = await this.sqsClient.send(new SendMessageCommand(params));
        console.log('Queue Response', send);

        return send;
    }

    /**
     * Send current body to queue
     * @param body
     * @param type
     * @param provider
     * @param delayInSeconds
     */
    static async notification(body: any, type: string, provider: string, delayInSeconds: number = 0): Promise<string[]> {
        let sends: any[] = [];
        for (const current in body) {
            if (body.hasOwnProperty(current)) {
                const notify: NotificationModel = new NotificationModel({
                    type: type,
                    provider: provider,
                    bean: body[current]
                });

                body[current]['notificationId'] = notify.id;

                await notify.save();
                const send = await this.send(body[current], delayInSeconds);

                if (send.MessageId) {
                    notify.providerResponse = send;
                    sends.push(notify.id);
                    await notify.save();
                }
            }
        }

        console.log('Queue Response', sends);
        return sends;
    }
}

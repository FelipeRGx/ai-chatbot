import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

export class Queue {
    private static sqsClient = new SQSClient({ region: process.env.AWS_REGION });

    /**
     * Send current queue message
     * @param body
     * @param delayInSeconds
     */
    static async send(body: object, delayInSeconds: number = 0) {
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
}

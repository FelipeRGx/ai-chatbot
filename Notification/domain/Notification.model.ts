import {DB} from 'shared/clases/DB.class';
import {Utils} from 'shared/clases/Utils.class';
import {NotificationI} from './Notification.interface';
import {AWSDynamoService} from 'shared/clases/aws/AWSDynamoService.class';

export class NotificationModel extends DB<any, any> implements NotificationI {
    readonly id: string;
    readonly bean: object;
    readonly type: string;
    readonly provider: string;
    readonly createdAt: number;

    send: boolean = false;
    providerResponse: object = {};

     constructor(notification: NotificationI) {
        super(new AWSDynamoService());

        this.bean = notification.bean;
        this.type = notification.type || '';
        this.id = notification.id || super.uuid();
        this.provider = notification.provider || '';
        this.createdAt = notification.createdAt || Utils.nowTimeStamp();
    }

    save(): Promise<any> {
        return super.save({
            TableName: process.env.NOTIFICATION_TABLE || '',
            Item: {
                id: this.id,
                type: this.type,
                bean: this.bean,
                provider: this.provider,
                createdAt: this.createdAt
            }
        }, this);
    }

    async findOne(): Promise<NotificationModel | false> {
        const notificationData: any = await super.findOne({
            TableName: process.env.NOTIFICATION_TABLE || '',
            Key: {
                id: this.id
            }
        });

        if (notificationData?.id) {
            return new NotificationModel(notificationData);
        }

        return false;
    }

    delete(): Promise<any> {
        return super.delete({
            TableName: process.env.NOTIFICATION_TABLE || '',
            Key: {
                id: this.id
            }
        });
    }

    query(): Promise<any> {
        return super.query({
            TableName: process.env.NOTIFICATION_TABLE || '',
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
                ':id': this.id
            }
        });
    }
}

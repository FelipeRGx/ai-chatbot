import * as json2csv from 'json2csv';
import {StatusCodes} from 'http-status-codes';
import {AWSS3Service} from 'shared/clases/aws/AWSS3Service.class';
import {MessageModel} from '../../../chatbot/domain/Message.model';

async function getManifestFile(s3Service: any, bucket: string, key: string): Promise<any> {
    try {
        const data = await s3Service.getObject({
            Bucket: bucket,
            Key: key
        }).promise();

        return JSON.parse(data.Body.toString('utf-8'));
    } catch (error) {
        console.error("Error getting manifest file:", error);
        throw error;
    }
}

async function updateManifestFile(s3Service: any, bucket: string, manifestKey: string, csvKey: string): Promise<any> {
    const manifest = await getManifestFile(s3Service, bucket, manifestKey);
    const csvUrl: string = `https://${bucket}.s3.amazonaws.com/${csvKey}`;
    manifest.fileLocations[0].URIs.push(csvUrl);

    const updatedManifest: string = JSON.stringify(manifest, null, 2);

    try {
        await s3Service.putObject({
            Bucket: bucket,
            Key: manifestKey,
            Body: updatedManifest,
            ContentType: 'application/json'
        }).promise();

        console.log('Manifest updated successfully');
    } catch (error) {
        console.error("Error updating manifest file:", error);
        throw error;
    }
}

exports.handler = async (event: any, context: any, callback: any): Promise<void> => {
    try {
        const chatbots: string[] = [
            '03f63ac8-7641-4138-8bf5-4b1fc6f496ff',
            '584323f9-f1fc-453d-8e21-f1fbf5d0649b'
        ];

        let csvData: any[] = [];
        const currentDate: string = new Date().toISOString().split('T')[0];

        for (const chatbotId of chatbots) {
            const messageModel: MessageModel = new MessageModel({ chatbotId: chatbotId });
            const interactionsCount: number = await messageModel.countInteractionsByChatbotId(chatbotId, 'user');
            const averageDuration: number = await messageModel.calculateAverageConversationDuration(chatbotId);

            csvData.push({
                date: currentDate,
                chatbotId: chatbotId,
                quantity: interactionsCount,
                averageTime: averageDuration
            });
        }

        const { Parser } = json2csv;
        const fields: string[] = ['chatbotId', 'date', 'quantity', 'averageTime'];
        const json2csvParser: json2csv.Parser<any> = new Parser({ fields });
        const csvKey: string = `BioParqueReport-${currentDate}.csv`;
        const csv: string = json2csvParser.parse(csvData);
        const s3Service: AWSS3Service = new AWSS3Service();
        const result = await s3Service.upload({
            Body: csv,
            Key: csvKey,
            ContentType: 'text/csv',
            Bucket: 'dev-chatbot-reports'
        });

        console.log('Upload CSV', result);
        const manifestKey: string = 'manifest-chatbot.json';
        await updateManifestFile(s3Service, 'dev-chatbot-reports', manifestKey, csvKey);

        callback(null, {
            body: JSON.stringify({ message: 'ok' }),
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

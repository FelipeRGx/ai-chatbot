import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export class AWSLambdaService {

    private static lambdaClient:LambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

    /**
     * Invoke current lambda
     * @param params
     */
    static async invoke(params: InvokeCommand['input']): Promise<any> {
        console.log('Lambda invoke');

        try {
            const data = await this.lambdaClient.send(new InvokeCommand(params));
            console.log('Lambda invoke success');
            return data;
        } catch (error) {
            console.log('Lambda invoke error', JSON.stringify(error));
            return {};
        }
    }
}

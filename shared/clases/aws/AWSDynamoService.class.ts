import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DBClient } from '../../interfaces/DBClient.interface';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

interface queryStatementI {
    params: any,
    page: number,
    limit?: number,
    tableName: string,
    indexName: string,
    filterExpression?: string,
    expressionAttributeValues?: { [key: string]: any }
}

export class AWSDynamoService implements DBClient<any, any> {

    private connection: DynamoDBDocumentClient;

    constructor() {
        const client: DynamoDBClient = new DynamoDBClient({
            region: process.env.AWS_REGION,
        });

        this.connection = DynamoDBDocumentClient.from(client);
    }

    async save(params: PutCommand['input']): Promise<any> {
        return this.connection.send(new PutCommand(params));
    }

    async findOne(params: GetCommand['input']): Promise<any> {
        return this.connection.send(new GetCommand(params));
    }

    async query(params: queryStatementI): Promise<any> {
        return this.connection.send(new QueryCommand(this.queryStatement(params)));
    }

    async update(params: UpdateCommand['input']): Promise<any> {
        return this.connection.send(new UpdateCommand(params));
    }

    async delete(params: DeleteCommand['input']): Promise<any> {
        return this.connection.send(new DeleteCommand(params));
    }

    /**
     * Query item with index attribute
     *
     * @param data
     */
    private queryStatement (data: queryStatementI): QueryCommand['input'] {
        let expressionAttributeNames:any = {};
        let expressionAttributeValues:any = {};

        let count: number = 0;
        let keyConditionExpression: string = '';
        const length: number = Object.keys(data.params).length;

        for (const currentKey in data.params) {
            if (data.params.hasOwnProperty(currentKey)) {
                keyConditionExpression += `#${currentKey} = :${currentKey}`;
                expressionAttributeNames[`#${currentKey}`] = currentKey;
                expressionAttributeValues[`:${currentKey}`] = data.params[currentKey];
            }

            count++;
            if (length > count) {
                keyConditionExpression += ' AND ';
            }
        }

        let query:any = {
            ScanIndexForward: false,
            TableName: data.tableName,
            IndexName: data.indexName,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        };

        if (data.filterExpression) {
            query.FilterExpression = data.filterExpression;
            Object.assign(query.ExpressionAttributeValues, data.expressionAttributeValues);
        }

        if (data.limit) {
            query['Limit'] = data.limit;
        }

        if (data.page) {
            query['ExclusiveStartKey'] = data.page;
        }

        return query;
    }
}

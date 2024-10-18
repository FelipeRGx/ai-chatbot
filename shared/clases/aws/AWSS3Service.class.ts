import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class AWSS3Service {
    private client: S3Client;

    constructor() {
        this.client = new S3Client({ region: process.env.AWS_REGION });
    }

    async upload(params: PutObjectCommand['input']): Promise<any> {
        return this.client.send(new PutObjectCommand(params));
    }

    async download(params: GetObjectCommand['input']): Promise<any> {
        return this.client.send(new GetObjectCommand(params));
    }

    async list(params: ListObjectsCommand['input']): Promise<any> {
        return this.client.send(new ListObjectsCommand(params));
    }

    async delete(params: DeleteObjectCommand['input']): Promise<any> {
        return this.client.send(new DeleteObjectCommand(params));
    }
}

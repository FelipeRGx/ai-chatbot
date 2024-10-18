import Axios, { AxiosRequestConfig } from 'axios';

export class PineconeConnection {
    private readonly baseUrl: string;

    constructor(private apiKey: string, private environment: string, private projectId: string) {
        this.baseUrl = `${this.environment}.pinecone.io`;
    }

    getRequestConfig(): AxiosRequestConfig {
        return {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Api-Key': `${this.apiKey}`
            }
        };
    }

    getBaseUrl(indexName: string): string {
        return `${indexName}-${this.projectId}.svc.${this.baseUrl}`;
    }
}

export class VectorService {
    constructor(private connection: PineconeConnection, private indexName: string) {}

    async upsert(indexName: string, upsertData: any, namespace: string = '') {
        try {
            const data: any = {vectors: upsertData};

            if (namespace) {
                data['namespace'] = namespace;
            }

            const url: string = `https://${this.connection.getBaseUrl(indexName)}/vectors/upsert`;
            return await Axios.post(url, data, this.connection.getRequestConfig());
        } catch (e) {
            console.log(e);
        }
    }

    async query(indexName: string, queryOptions: any) {
        const url: string = `https://${this.connection.getBaseUrl(indexName)}/query`;
        return await Axios.post(url, queryOptions, this.connection.getRequestConfig());
    }

    async fetch(indexName: string) {
        const url: string = `https://${this.connection.getBaseUrl(indexName)}/vectors/fetch`;
        return await Axios.get(url, this.connection.getRequestConfig());
    }

    async delete(indexName: string, deleteOptions: any) {
        const url: string = `https://${this.connection.getBaseUrl(indexName)}/vectors/delete`;
        return await Axios.post(url, deleteOptions, this.connection.getRequestConfig());
    }

    async deleteNamespace(indexName: string, namespace: string) {
        try {
            const url: string = `https://${this.connection.getBaseUrl(indexName)}/vectors/delete?deleteAll=true&namespace=${namespace}`;
            return await Axios.post(url, {}, this.connection.getRequestConfig());
        } catch (e) {
            console.log(e);
        }
    }

    async save(id:string, embeddingsResponse: any): Promise<any> {
        for (const current in embeddingsResponse.texts) {
            await this.upsert(this.indexName || '', [{
                metadata: {
                    data: embeddingsResponse.texts[current],
                },
                id: `${id}-${current}`,
                values: embeddingsResponse.embeddings[current]
            }]);
        }
    }

    async search(embedding: any, namespace: string = '', filter: any = null, limit: number = 4): Promise<any> {
        let queryOptions: any = {
            topK: limit,
            vector: embedding,
            includeValues: true,
            includeMetadata: true
        };

        if (namespace) {
            queryOptions['namespace'] = namespace;
        }

        if (filter) {
            queryOptions['filter'] = filter;
        }

        return this.query(this.indexName || '', queryOptions);
    }
}

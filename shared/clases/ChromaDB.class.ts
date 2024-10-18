import Axios, {AxiosRequestConfig} from 'axios';

export class ChromaDBConnection {
    private readonly baseUrl: string;

    constructor() {
        console.log('ChromaDB node');
        this.baseUrl = `http://140.84.187.202:8000`;
    }

    getRequestConfig(): AxiosRequestConfig {
        return {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }
}

export class VectorService {
    constructor(private connection: ChromaDBConnection) {}

  async getElementsBySourceType(collection: string, dataSourcesType: string): Promise<any> {
    const queryOptions = {
      limit: 1000,
      include: ["metadatas"],
      where: {
        dataSourcesType: dataSourcesType,
      },
    };

    return this.get(collection, queryOptions);
  }

  async upsert(upsertData: any, collection: string = "") {
    try {
      const url: string = `${this.connection.getBaseUrl()}/api/v1/collections/${collection}/upsert`;
      await Axios.post(url, upsertData[0], this.connection.getRequestConfig());
    } catch (error) {
      console.log("VectorService ~ upsert ~ error:", error);
    }
  }

  async query(collection: string, queryOptions: any): Promise<any> {
    try {
      const url: string = `${this.connection.getBaseUrl()}/api/v1/collections/${collection}/query`;
        return await Axios.post(
          url,
          queryOptions,
          this.connection.getRequestConfig()
      );
    } catch (error) {
      console.log("VectorService ~ query ~ error:", error);
    }
  }

  async get(collection: string, queryOptions: any): Promise<any> {
    try {
      const url: string = `${this.connection.getBaseUrl()}/api/v1/collections/${collection}/get`;
      const response = await Axios.post(url, queryOptions, this.connection.getRequestConfig());

      return response.data;
    } catch (error) {
      console.log("VectorService ~ Get ~ error:", error);
    }
  }

  async delete(collection: string, chunkIds: string[]): Promise<any> {
    try {
      const url: string = `${this.connection.getBaseUrl()}/api/v1/collections/${collection}/delete`;
      const queryOptions = {
        ids: chunkIds,
      };

      return await Axios.post(
        url,
        queryOptions,
        this.connection.getRequestConfig()
      );
    } catch (e) {
      console.log(e);
    }
  }

  async save(
    id: string,
    embeddingsResponse: {
      text: string;
      chunkId: string;
      dataSourcesType: string;
      embeddings: any[];
      originalText: string;
      createdAt: number;
    },
    collection: string
  ): Promise<any> {
    await this.upsert(
      [
        {
          metadatas: [
            {
              data: embeddingsResponse.originalText,
              dataSourcesId: id,
              dataSourcesType: embeddingsResponse.dataSourcesType,
              chunkId: embeddingsResponse.chunkId,
              createdAt: embeddingsResponse.createdAt
            },
          ],
          documents: [embeddingsResponse.text],
          ids: [embeddingsResponse.chunkId],
          embeddings: [embeddingsResponse.embeddings],
        },
      ],
      collection
    );
  }

  async search(
    embedding: any,
    collection: string,
    filter: any = null,
    limit: number = 4
  ): Promise<any> {
    let queryOptions = {
      n_results: limit,
      include: ["metadatas", "documents", "distances"],
      where: {},
      query_embeddings: embedding,
    };

    if (filter) {
      queryOptions["where"] = filter;
    }

    return this.query(collection, queryOptions);
  }
}

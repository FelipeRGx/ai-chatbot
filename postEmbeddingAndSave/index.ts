import {PineconeConnection, VectorService} from 'shared/clases/Pinecone.class';
import {IEmbeddingService} from 'shared/interfaces/IProcessContext.interface';
import {OpenAIApiHandler} from 'shared/clases/OpenAIApi.class';

const connection: PineconeConnection = new PineconeConnection('cb650701-0b10-40af-9777-c0b55421cbeb', 'us-east-1-aws', 'n3k4y7q');
const vectorService: VectorService = new VectorService(connection, 'm3consulting');

async function deleteNamespace(): Promise<any> {
    await vectorService.deleteNamespace('bioparquemexico', 'messages');
}

async function saveVectorData(namespace: string, id:string, text: any): Promise<any> {
    const openAiHandler: OpenAIApiHandler = new OpenAIApiHandler('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');
    const embeddingService: IEmbeddingService = openAiHandler.getEmbeddingService();
    const embeddingsResponse = await embeddingService.create(text);

    for (const current in embeddingsResponse.texts) {
        const response = await vectorService.upsert('bioparquemexico', [{
            metadata: {
                data: embeddingsResponse.texts[current],
            },
            id: `${id}-${current}`,
            values: embeddingsResponse.embeddings[current]
        }], namespace);

        console.log(response);
    }
}

function replaceAccents(text: string): string {
    return text.replace(/á/g, '\\u00e1')
        .replace(/é/g, '\\u00e9')
        .replace(/í/g, '\\u00ed')
        .replace(/ó/g, '\\u00f3')
        .replace(/ú/g, '\\u00fa')
        .replace(/ñ/g, '\\u00f1')
        .replace(/Á/g, '\\u00c1')
        .replace(/É/g, '\\u00c9')
        .replace(/Í/g, '\\u00cd')
        .replace(/Ó/g, '\\u00d3')
        .replace(/Ú/g, '\\u00da')
        .replace(/Ñ/g, '\\u00d1');
}

exports.handler = async (event: any, context: any, callback: any): Promise<void> => {
    try {
        //await deleteNamespace();
        let jsonData;
        let namespace = '';

        try {
            jsonData = JSON.parse(event.body);
            namespace = process.env.NAME_SPACE || '';
        } catch (error) {
            console.error("Error al parsear JSON: ", error);
            return callback(null, {
                body: 'Error parsing JSON',
                statusCode: 400,
            });
        }

        for (let current in jsonData) {
            jsonData[current] = replaceAccents(jsonData[current]);
            await saveVectorData(namespace, current, jsonData[current]);
        }

        callback(null, {
            body: 'Data saved successfully',
            statusCode: 200
        });
    } catch (error) {
        console.error(error);

        callback(null, {
            body: 'Internal Server Error',
            statusCode: 500,
        });
    }
};

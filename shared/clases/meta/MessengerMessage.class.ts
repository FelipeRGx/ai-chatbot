import {HttpRequest} from '../HttpRequest.class';

export interface MessengerMessageI {
    text: string;
    recipientId: string;
    messaging_type?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
}

export class MessengerMessageService {
    private readonly request: HttpRequest;
    private readonly API_TOKEN: string;


    constructor(request: HttpRequest, apiToken: string) {
        this.request = request;
        this.API_TOKEN = apiToken;
    }

    async sendMessage(message: MessengerMessageI): Promise<any> {
        try {
            const postData = {
                messaging_type: 'RESPONSE',
                recipient: {
                    id: message.recipientId
                },
                message: {
                    text: message.text
                }
            };
            console.log('🚀 ~ MessengerMessageService ~ sendMessage ~ postData:', postData)

            const tokenResponse: HttpRequest = new HttpRequest('https://graph.facebook.com');
            console.log('🚀 ~ MessengerMessageService ~ sendMessage ~ tokenResponse:', tokenResponse)
            //const token = await tokenResponse.get(`${pageId}/accounts?access_token=${this.API_TOKEN}`);


            const response = await this.request.post(
                {},
                `messages?recipient={'id':'${postData.recipient.id}'}&messaging_type=${postData.messaging_type}&message={'text':'${message.text}'}&access_token=${this.API_TOKEN}`,
                {
                    'Content-Type': 'application/json'
                }
            );
            console.log('🚀 ~ MessengerMessageService ~ sendMessage ~ response:', response)

            if (response.status === 200) {
                console.log('Mensaje enviado con éxito');
            } else {
                console.error('Error al enviar el mensaje:', response.data);
            }

            return response;
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
        }
    }
}

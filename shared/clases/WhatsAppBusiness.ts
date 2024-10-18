import FormData from 'form-data';
import {HttpRequest} from './HttpRequest.class';
import {MessengerMessageI, MessengerMessageService} from "./meta/MessengerMessage.class";

const API_ENDPOINT: string = 'https://graph.facebook.com/v17.0/';

export interface WhatsAppMessage {
    messaging_product: 'whatsapp' | 'page' | 'instagram';
    recipient_type?: string;
    to?: string;
    type?: 'template' | 'text' | 'interactive' | 'location' | 'image' | 'audio' | 'video' | 'file';
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: Component[];
    };
    status?: string;
    message_id?: string;
    text?: {
        'preview_url': boolean;
        body: string;
    };
    audio?: {
        id: string;
    }
}

interface Component {
    type: 'header' | 'body' | 'button';
    parameters: Parameter[];
}

interface Parameter {
    type: 'text' | 'currency' | 'date_time' | 'location' | 'image' | 'payload';

    [key: string]: any;
}

interface TemplateMessage {
    type: 'template';
    template: {
        name: string;
        language: {
            code: string;
        };
        components: TemplateComponent[];
    };
}

interface TemplateComponent {
    type: 'header' | 'body' | 'button';
    sub_type?: 'quick_reply';
    index?: string;
    parameters: TemplateParameter[];
}

interface TemplateParameter {
    type: 'image' | 'text' | 'currency' | 'date_time' | 'payload';

    [key: string]: any;
}

interface IMessageService {
    sendMessage(message: WhatsAppMessage): Promise<void>;
}

interface IReadService {
    markMessageAsRead(messageId: string): Promise<void>;
}

interface IMediaService {
    media(): Promise<any>;
}

interface IMediaUploadService {
    uploadMedia(buffer: Buffer, mediaType: string, fileName: string): Promise<any>;
}

interface IInteractiveMessageService {
    sendInteractiveMessage(recipient: string, buttonText: string, buttons: Button[]): Promise<void>;
}

interface ITemplateMessageService {
    sendTemplateMessage(recipient: string, templateMessage: TemplateMessage): Promise<void>;
}

interface Button {
    id: string;
    title: string;
}

interface IInteractiveListService {
    sendInteractiveListMessage(recipient: string, headerText: string, bodyText: string, footerText: string, buttonText: string, sections: Section[]): Promise<void>;
}

interface Section {
    title: string;
    rows: Row[];
}

interface Row {
    id: string;
    title: string;
    description: string;
}

class MessageService implements IMessageService {
    private readonly request: HttpRequest;
    private readonly API_TOKEN: string;

    constructor(request: HttpRequest, apiToken: string) {
        this.request = request;
        this.API_TOKEN = apiToken;
    }

    async sendMessage(message: WhatsAppMessage): Promise<any> {
        try {
            const response = await this.request.post(message, 'messages', {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_TOKEN}`
            });

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

class ReadService implements IReadService {
    private readonly request: HttpRequest;
    private readonly API_TOKEN: string;

    constructor(request: HttpRequest, apiToken: string) {
        this.request = request;
        this.API_TOKEN = apiToken;
    }

    async markMessageAsRead(messageId: string): Promise<void> {
        try {
            const message: WhatsAppMessage = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            };

            const response = await this.request.post(message, 'messages', {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_TOKEN}`
            });

            if (response.status === 200 && response.data.success) {
                console.log('Mensaje marcado como leído con éxito');
            } else {
                console.error('Error al marcar el mensaje como leído:', response.data);
            }
        } catch (error) {
            console.error('Error al marcar el mensaje como leído:', error);
        }
    }
}

class MediaService implements IMediaService {
    private readonly request: HttpRequest;
    private readonly API_TOKEN: string;

    constructor(request: HttpRequest, apiToken: string) {
        this.request = request;
        this.API_TOKEN = apiToken;
    }

    async media(): Promise<any> {
        try {
            const response: any = await this.request.get('', {}, {
                'Authorization': `Bearer ${this.API_TOKEN}`
            });

            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
        }

        return null;
    }
}

class MediaUploadService implements IMediaUploadService {
    private readonly request: HttpRequest;
    private readonly API_TOKEN: string;

    constructor(request: HttpRequest, apiToken: string) {
        this.request = request;
        this.API_TOKEN = apiToken;
    }

    async uploadMedia(buffer: Buffer, mediaType: string, fileName: string): Promise<any> {
        const formData = new FormData();
        formData.append('type', mediaType);
        formData.append('messaging_product', 'whatsapp');
        formData.append('file', buffer, {filename: fileName});

        try {
            const response = await this.request.post(formData, 'media', {
                'Authorization': `Bearer ${this.API_TOKEN}`,
                ...formData.getHeaders()
            });

            if (response.status === 200) {
                console.log('Media uploaded successfully');
                return response.data;
            } else {
                console.error('Error uploading media:', response.data);
            }
        } catch (error) {
            console.error('Error uploading media:', error);
        }

        return null;
    }
}

class InteractiveMessageService implements IInteractiveMessageService {
    private readonly request: HttpRequest;
    private readonly API_TOKEN: string;

    constructor(request: HttpRequest, apiToken: string) {
        this.request = request;
        this.API_TOKEN = apiToken;
    }

    async sendInteractiveMessage(recipient: string, buttonText: string, buttons: Button[]): Promise<any> {
        const message: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipient,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text: buttonText
                },
                action: {
                    buttons: buttons.map(button => ({
                        type: 'reply',
                        reply: {
                            id: button.id,
                            title: button.title.substring(0, 20)
                        }
                    }))
                }
            }
        };

        try {
            const response: any = await this.request.post(message, 'messages', {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_TOKEN}`
            });

            if (response.status !== 200) {
                console.error('Error sending interactive message:', response.data);
            }

            return response;
        } catch (error) {
            console.error('Error sending interactive message:', error);
        }

        return null;
    }
}

class InteractiveListService implements IInteractiveListService {
    private readonly request: HttpRequest;
    private readonly API_TOKEN: string;

    constructor(request: HttpRequest, apiToken: string) {
        this.request = request;
        this.API_TOKEN = apiToken;
    }

    async sendInteractiveListMessage(recipient: string, headerText: string, bodyText: string, footerText: string, buttonText: string, sections: Section[]): Promise<any> {
        const message = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipient,
            type: "interactive",
            interactive: {
                type: "list",
                header: {
                    type: "text",
                    text: headerText
                },
                body: {
                    text: bodyText
                },
                footer: {
                    text: footerText
                },
                action: {
                    button: buttonText,
                    sections: sections
                }
            }
        };

        try {
            const response = await this.request.post(message, 'messages', {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_TOKEN}`
            });

            if (response.status !== 200) {
                console.error('Error sending interactive list message:', response.data);
            }

            return response;
        } catch (error) {
            console.error('Error sending interactive list message:', error);
        }

        return null;
    }
}

class TemplateMessageService implements ITemplateMessageService {
    private readonly request: HttpRequest;
    private readonly API_TOKEN: string;

    constructor(request: HttpRequest, apiToken: string) {
        this.request = request;
        this.API_TOKEN = apiToken;
    }

    async sendTemplateMessage(recipient: string, templateMessage: TemplateMessage): Promise<void> {
        const message = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipient,
            ...templateMessage
        };

        try {
            const response = await this.request.post(message, 'messages', {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_TOKEN}`
            });

            if (response.status !== 200) {
                console.error('Error sending template message:', response.data);
            }
        } catch (error) {
            console.error('Error sending template message:', error);
        }
    }
}

export class WhatsAppBusiness {
    private readonly API_TOKEN: string;
    private readonly readService: IReadService;
    private readonly mediaService: IMediaService;
    private readonly messageService: IMessageService;
    private readonly mediaUploadService: IMediaUploadService;
    private readonly interactiveListService: IInteractiveListService;
    private readonly templateMessageService: ITemplateMessageService;
    private readonly interactiveMessageService: IInteractiveMessageService;

    private readonly messengerMessageService: MessengerMessageService;

    constructor(channelId: string, apiToken: string) {
        this.API_TOKEN = apiToken;

        const httpRequest: HttpRequest = new HttpRequest(`${API_ENDPOINT}${channelId}`);
        this.interactiveMessageService = new InteractiveMessageService(httpRequest, apiToken);
        this.interactiveListService = new InteractiveListService(httpRequest, apiToken);
        this.templateMessageService = new TemplateMessageService(httpRequest, apiToken);
        this.mediaUploadService = new MediaUploadService(httpRequest, apiToken);
        this.messageService = new MessageService(httpRequest, apiToken);
        this.mediaService = new MediaService(httpRequest, apiToken);
        this.readService = new ReadService(httpRequest, apiToken);

        this.messengerMessageService = new MessengerMessageService(httpRequest, apiToken);
    }

    async sendMessage(message: WhatsAppMessage): Promise<any> {
        return this.messageService.sendMessage(message);
    }

    async markMessageAsRead(messageId: string): Promise<void> {
        return this.readService.markMessageAsRead(messageId);
    }

    async media(): Promise<any> {
        return this.mediaService.media();
    }

    async uploadMedia(buffer: Buffer, fileType: string, mediaType: string): Promise<any> {
        return this.mediaUploadService.uploadMedia(buffer, fileType, mediaType);
    }

    async sendInteractiveMessage(recipient: string, buttonText: string, buttons: Button[]): Promise<void> {
        return this.interactiveMessageService.sendInteractiveMessage(recipient, buttonText, buttons);
    }

    async sendInteractiveListMessage(recipient: string, headerText: string, bodyText: string, footerText: string, buttonText: string, sections: Section[]): Promise<void> {
        return this.interactiveListService.sendInteractiveListMessage(recipient, headerText, bodyText, footerText, buttonText, sections);
    }

    async sendTemplateMessage(recipient: string, templateMessage: TemplateMessage): Promise<void> {
        return this.templateMessageService.sendTemplateMessage(recipient, templateMessage);
    }

    async sendMessengerMessage(message: MessengerMessageI): Promise<any> {
        return this.messengerMessageService.sendMessage(message);
    }
}

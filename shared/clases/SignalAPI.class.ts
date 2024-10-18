import {HttpRequest} from './HttpRequest.class';

export class SignalAPI {
    private readonly request: HttpRequest;

    constructor() {
        this.request = new HttpRequest('http://3.70.238.76:8080');
    }

    async checkHealth () {
        return await this.request.get('v1/health');
    }

    async getQR () {
        return await this.request.get('v1/qrcodelink?device_name=signal-api');
    }

    async newMessages (phoneNumber: string) {
        return await this.request.get(`v1/receive/${phoneNumber}`);
    }

    async sendMessages (phoneNumber: string, message: string, recipient: string[], base64attachments: string[] = []): Promise<any> {
        return await this.request.post({
            message: message,
            number: phoneNumber,
            recipients: recipient,
            base64_attachments: base64attachments
        }, `v2/send`);
    }

    async createGroup(name: string, members: string[], phoneNumber: string): Promise<any> {
        return await this.request.post({
            name: name,
            members: members
        }, `v1/groups/${phoneNumber}`);
    }
}

import axios from 'axios';

export class Telegram {
    BASE_URL = 'https://api.telegram.org';

    constructor(private token: string) {}

    setWebhook(data: { url: string; secret_token?: string }) {
        return axios.post(this.apiMethod('setWebhook'), data);
    }

    sendMessage(chat_id: number, text: string) {
        return axios.post(this.apiMethod('sendMessage'), { chat_id, text });
    }

    private apiMethod(recurso: string) {
        const urlBuilder = [
            this.BASE_URL,
            '/',
            'bot',
            this.token,
            '/',
            recurso,
        ];
        return urlBuilder.join('');
    }
}

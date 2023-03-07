import axios from 'axios';

export class Telegram {
    BASE_URL = 'https://api.telegram.org';
    offset?: number;

    constructor(
        private token: string,
        private allowed_updates?: Array<'message'>,
    ) {}

    async getUpdates() {
        const { offset } = this;
        const response = await axios
            .post(this.apiMethod('getUpdates'), addIfDefined({}, { offset }))
            .then((res) => res.data);
        const results = response.result;
        return results;
    }

    updateOffset(update_id: number) {
        this.offset = update_id;
    }

    deleteWebhook() {
        return axios.post(this.apiMethod('deleteWebhook'));
    }

    setWebhook(data: { url: string; secret_token?: string }) {
        const { allowed_updates } = this;
        return axios.post(
            this.apiMethod('setWebhook'),
            addIfDefined(data, { allowed_updates }),
        );
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

function addIfDefined<T extends {}, U extends {}>(
    source: T,
    data: U,
): T & Partial<U> {
    const target = Object.assign({}, source);
    for (const key in data) {
        if (!data[key]) continue;
        Object.assign(target, { [key]: data[key] });
    }
    return target;
}

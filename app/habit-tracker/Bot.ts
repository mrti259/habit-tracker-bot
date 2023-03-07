import { Telegram } from '../telegram/Telegram';
import { HabitTracker, RejectionReason } from './HabitTracker';
import { IStorage } from './storages/IStorage';
import {
    NotionStorage,
    NotionStorageConfig,
} from './storages/notion/NotionStorage';

type BotConfig = {
    app_url: string;
    secret_token: string;
    telegram_token: string;
    notion: NotionStorageConfig;
};

export class Bot {
    private telegram: Telegram;
    private storage: IStorage;

    constructor(private config: BotConfig) {
        this.telegram = new Telegram(config.telegram_token, ['message']);
        this.storage = new NotionStorage(config.notion);
    }

    async getUpdates() {
        await this.telegram.deleteWebhook();
        const updates = await this.telegram.getUpdates();
        for (const update of updates) {
            await this.handleUpdate(update);
        }
    }

    async webhookSetter() {
        const url = this.config.app_url + '/api/webhook';
        const secret_token = this.config.secret_token;
        const response = await this.telegram.setWebhook({
            url,
            secret_token,
        });
        return response;
    }

    async webhookHandler(
        headers: Record<string, string | string[] | undefined>,
        body: {
            update_id: number;
            message?: {
                chat: { id: number; first_name?: string; last_name?: string };
                text: string;
            };
        },
    ) {
        if (!this.acceptUpdateOrigin(headers)) {
            return;
        }
        await this.handleUpdate(body);
    }

    private async handleUpdate(update: {
        update_id: number;
        message?: {
            chat: { id: number; first_name?: string; last_name?: string };
            text: string;
        };
    }) {
        const { message } = update;
        if (!message) return;

        const { chat, text } = message;
        const { id: chat_id, first_name, last_name } = chat;

        const tracker = await HabitTracker.forChat(
            { id: chat_id, name: `${first_name} ${last_name}`.trim() },
            this.storage,
        );
        const reply = async (msg: string) => {
            await this.telegram.sendMessage(chat_id, msg);
        };
        tracker.onCommand('/start', () => reply('hola'));
        tracker.onCommand('/reporte', () =>
            tracker.report().then((report) => reply(report)),
        );
        tracker.onItemAdded((meal, item) =>
            reply(`${item} agregado a ${meal}`),
        );
        tracker.onChatUnknown(() => reply('No estás autorizado a usar el bot'));
        tracker.onCommandUnknown(() =>
            reply(`Ingresá un comando del menú con el item a agregar.
Por ejemplo, "/desayuno café"`),
        );
        tracker.onCommandError(() => reply('Ocurrió un error'));
        await tracker.accept(text);
        this.telegram.updateOffset(update.update_id + 1);
    }

    private acceptUpdateOrigin(
        headers: Record<string, string | string[] | undefined>,
    ) {
        const secret_token = headers['x-telegram-bot-api-secret-token'];
        return secret_token === this.config.secret_token;
    }
}

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
        this.telegram = new Telegram(config.telegram_token);
        this.storage = new NotionStorage(config.notion);
    }

    webhookSetter = async () => {
        const url = this.config.app_url + '/api/webhook';
        const secret_token = this.config.secret_token;
        const response = await this.telegram.setWebhook({
            url,
            secret_token,
        });
        return response;
    };

    updateHandler = async (
        headers: Record<string, string | string[] | undefined>,
        body: {
            message: {
                chat: { id: number; first_name: string; last_name?: string };
                text: string;
            };
        },
    ) => {
        if (!this.acceptUpdateOrigin(headers)) {
            return false;
        }
        const { chat, text } = body.message;
        const { id: chat_id, first_name, last_name = '' } = chat;
        const tracker = await HabitTracker.forChat(
            { id: chat_id, name: `${first_name} ${last_name}`.trim() },
            this.storage,
        );
        const reply = async (msg: string) => {
            await this.telegram.sendMessage(chat_id, msg);
        };
        tracker.onCommand('/start', () => reply('hola'));
        tracker.onItemAdded(async (meal, item) => {
            await Promise.all([
                reply(`${item} agregado a ${meal}`),
                tracker.report(),
            ]).then(([_, report]) => reply(report));
        });
        tracker.onRejection(async (reason) => {
            if (reason === RejectionReason.UNKNOWN_CHAT) {
                await reply('No estás autorizado a usar el bot');
            }
            await reply(`Ingresá un comando del menú con el item a agregar.
Por ejemplo, "/desayuno café"`);
        });

        await tracker.accept(text);
    };

    private acceptUpdateOrigin(
        headers: Record<string, string | string[] | undefined>,
    ) {
        const secret_token = headers['x-telegram-bot-api-secret-token'];
        return secret_token === this.config.secret_token;
    }
}

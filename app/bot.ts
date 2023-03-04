import {
    APP_URL,
    DBHABIT_ID,
    DBITEM_ID,
    DBUSER_ID,
    NOTION_TOKEN,
    SECRET_TOKEN,
    TELEGRAM_TOKEN,
} from './constants';
import { Bot } from './habit-tracker/Bot';

export const bot = new Bot({
    app_url: APP_URL,
    secret_token: SECRET_TOKEN,
    telegram_token: TELEGRAM_TOKEN,
    notion: {
        auth_token: NOTION_TOKEN,
        dbhabit_id: DBHABIT_ID,
        dbitem_id: DBITEM_ID,
        dbuser_id: DBUSER_ID,
    },
});

import express from 'express';

import { Bot } from './habit-tracker/Bot';

export function app(bot: Bot) {
    const self = express();

    self.use(express.json());

    self.get('/api/setWebhook', async (req, res) => {
        const response = await bot.webhookSetter();
        return res.send(response.statusText);
    });

    self.post('/api/webhook', async (req, res) => {
        const headers = req.headers;
        const body = req.body;
        await bot.updateHandler(headers, body);
        return res.send(true);
    });

    return self;
}

import { VercelRequest, VercelResponse } from '@vercel/node';

import { bot } from '../app/bot';

export default async function (req: VercelRequest, res: VercelResponse) {
    const response = await bot.webhookSetter();
    return res.send(response.statusText);
}

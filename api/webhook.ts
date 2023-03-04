import type { VercelRequest, VercelResponse } from '@vercel/node';

import { bot } from '../app/bot';

export default async function (req: VercelRequest, res: VercelResponse) {
    const headers = req.headers;
    const body = req.body;
    await bot.updateHandler(headers, body);
    return res.send(true);
}

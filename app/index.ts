import { app } from './app';
import { bot } from './bot';
import { APP_PORT } from './constants';

app(bot).listen(APP_PORT, () => {
    console.log(`Listening on port ${APP_PORT}`);
});

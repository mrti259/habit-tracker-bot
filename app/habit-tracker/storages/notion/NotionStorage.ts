import { Client } from '@notionhq/client';

import { Database } from '../../../notion/Database';
import { Chat, User } from '../../User';
import { IStorage } from '../IStorage';
import { Habit, habitSchema } from './schemas/habitSchema';
import { Item, itemSchema } from './schemas/itemSchema';
import { userSchema } from './schemas/userSchema';

export type NotionStorageConfig = {
    auth_token: string;
    dbhabit_id: string;
    dbitem_id: string;
    dbuser_id: string;
};

export class NotionStorage implements IStorage {
    private habitDatabase: Database<Habit>;
    private itemDatabase: Database<Item>;
    private userDatabase: Database<User>;

    constructor(config: NotionStorageConfig) {
        const client = new Client({ auth: config.auth_token });
        this.habitDatabase = new Database(
            client,
            config.dbhabit_id,
            habitSchema,
        );
        this.itemDatabase = new Database(client, config.dbitem_id, itemSchema);
        this.userDatabase = new Database(client, config.dbuser_id, userSchema);
    }

    async getItemsFromHabit(habit: string): Promise<Array<string>> {
        const today = new Date();
        const habits = await this.habitDatabase.query({ command: [habit] });
        const items = await this.itemDatabase.query({
            habit_id: habits.map((h) => h.id),
            date: [today],
        });
        return items.map((item) => item.title);
    }

    async addItemToHabit(habit: string, item: string): Promise<void> {
        const habits = await this.habitDatabase.query({ command: [habit] });
        if (!habits.length) return;
        await this.itemDatabase.create([
            { title: item, habit_id: habits[0].id, date: new Date() },
        ]);
    }

    async getUserByChat(chat: Chat): Promise<User | undefined> {
        const users = await this.userDatabase.query({ chat_id: [chat.id] });
        const user = users[0];
        if (user) return user;
        return await this.createUser(chat);
    }

    private async createUser(chat: Chat) {
        const users = await this.userDatabase.create([
            { name: chat.name, chat_id: chat.id, auth: false },
        ]);
        return users[0];
    }
}

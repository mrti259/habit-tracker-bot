import { Chat, User } from '../User';
import { IStorage } from './IStorage';

function createChat(id: number): Chat {
    return { id, name: '' };
}

const KNOWN_CHAT = createChat(0);
const UNKNOW_CHAT = createChat(1);
const UNAUTH_CHAT = createChat(2);

export class Storage implements IStorage {
    private items = new Map<string, Array<string>>();

    async getItemsFromHabit(habit: string): Promise<Array<string>> {
        return this.items.get(habit) || [];
    }

    async addItemToHabit(habit: string, item: string): Promise<void> {
        const items = await this.getItemsFromHabit(habit);
        this.items.set(habit, [...items, item]);
    }

    // Testing

    static KNOWN_CHAT = KNOWN_CHAT;
    static UNKNOWN_CHAT = UNKNOW_CHAT;
    static UNAUTH_CHAT = UNAUTH_CHAT;

    async getUserByChat(chat: Chat): Promise<User | undefined> {
        if (chat === UNKNOW_CHAT) return undefined;
        return {
            auth: chat === KNOWN_CHAT,
            chat_id: chat.id,
            name: chat.name,
        };
    }
}

import { Chat, User } from '../User';

export interface IStorage {
    getItemsFromHabit(habit: string): Promise<Array<string>>;
    addItemToHabit(habit: string, item: string): Promise<void>;
    getUserByChat(chat: Chat): Promise<User | undefined>;
}

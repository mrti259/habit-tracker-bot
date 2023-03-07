import { Chat } from './User';
import { IStorage } from './storages/IStorage';

type CommandCallback = (command: string) => void;
type ItemAddedCallback = (habit: string, item: string) => void;
type ChatUnknownCallback = () => void;
type CommandUnknownCallback = () => void;
type CommandErrorCallback = () => void;

export enum RejectionReason {
    UNKNOWN_CHAT = 'unknown_chat',
    UNKNOWN_COMMAND = 'unknown_command',
    COMMAND_ERROR = 'command_error',
}

const HABIT_COMMANDS = [
    '/desayuno',
    '/media_maniana',
    '/almuerzo',
    '/merienda',
    '/cena',
    '/agua',
] as const;

const NO_ITEMS_MESSAGE = 'No hay items';
const NO_REPORT_MESSAGE = '';

export class HabitTracker {
    static NO_ITEMS_MESSAGE = NO_ITEMS_MESSAGE;
    static NO_REPORT_MESSAGE = NO_REPORT_MESSAGE;

    // Authentication

    static async forChat(chat: Chat, storage: IStorage): Promise<HabitTracker> {
        const user = await storage.getUserByChat(chat);
        const auth = user?.auth || false;
        return new this(auth, storage);
    }

    // Testing

    static forKnownUser(storage: IStorage) {
        return new this(true, storage);
    }

    static forUnknownUser(storage: IStorage) {
        return new this(false, storage);
    }

    // Initialization

    private constructor(private auth: boolean, private storage: IStorage) {
        HABIT_COMMANDS.forEach((command) => {
            const allowEmpty = command === '/agua';
            this.addHabitCommand(command, allowEmpty);
        });
    }

    // Storing

    private getItemsFromHabit(habit: string) {
        return this.storage.getItemsFromHabit(habit);
    }

    private async addItemToHabit(habit: string, item: string) {
        await this.storage.addItemToHabit(habit, item);
        await this.triggerItemAddedCallbacks(habit, item);
    }

    // Command handling

    async accept(message: string): Promise<boolean> {
        if (!this.auth) {
            await this.triggerChatUnknownCallbacks();
            return false;
        }
        let handled = await this.handleMessage(message);
        if (handled) return true;
        await this.triggerCommandUnknownCallbacks();
        return false;
    }

    private async handleMessage(message: string) {
        let handled = false;
        for (const command of this.eventSubscriptions.command.keys()) {
            handled ||= await this.handleCommand(command, message);
        }
        return handled;
    }

    private async handleCommand(
        command: string,
        message: string,
    ): Promise<boolean> {
        if (!message.startsWith(command)) {
            return false;
        }
        const subscriptions = this.eventSubscriptions.command.get(command);
        const result = await Promise.allSettled(
            subscriptions!.map((cb) => cb(message)),
        );
        if (result.every((p) => p.status === 'fulfilled')) return true;
        this.triggerCommandErrorCallbacks();
        return true;
    }

    private addHabitCommand(command: string, allowEmpty: boolean) {
        this.onCommand(command, async (message) => {
            let text = message.substring(command.length).trim();
            if (!allowEmpty && !text) {
                throw new Error();
            }
            const habit = command.substring(1);
            const item = (text || habit).replace(/^\w/, (str) =>
                str.toUpperCase(),
            );
            await this.addItemToHabit(habit, item);
        });
    }

    // Reporting

    async report() {
        if (!this.auth) return NO_REPORT_MESSAGE;
        const vasos = await this.countItemsFromHabit('agua');
        const format = `Desayuno:
  ${await this.listItemsFromHabit('desayuno')}
Media mañana:
  ${await this.listItemsFromHabit('media_maniana')}
Almuerzo:
  ${await this.listItemsFromHabit('almuerzo')}
Merienda:
  ${await this.listItemsFromHabit('merienda')}
Cena:
  ${await this.listItemsFromHabit('cena')}
Agua:
  ${vasos} vaso${vasos === 1 ? '' : 's'}`;
        return format;
    }

    private async listItemsFromHabit(habit: string) {
        const items = await this.getItemsFromHabit(habit);
        if (!items.length) return NO_ITEMS_MESSAGE;
        return items.join('\n  ');
    }

    private async countItemsFromHabit(habit: string) {
        const items = await this.getItemsFromHabit(habit);
        return items.length;
    }

    // Event-handling

    private eventSubscriptions = {
        command: new Map<string, Array<CommandCallback>>(),
        itemAdded: [] as Array<ItemAddedCallback>,
        chatUnknown: [] as Array<ChatUnknownCallback>,
        commandUnknown: [] as Array<CommandUnknownCallback>,
        commandError: [] as Array<CommandErrorCallback>,
    };

    onCommand(command: string, callback: CommandCallback) {
        const { command: commandSubscriptions } = this.eventSubscriptions;
        const subscriptions = commandSubscriptions.get(command) || [];
        commandSubscriptions.set(command, [...subscriptions, callback]);
    }

    onItemAdded(callback: ItemAddedCallback) {
        this.eventSubscriptions.itemAdded.push(callback);
    }

    onChatUnknown(callback: ChatUnknownCallback) {
        this.eventSubscriptions.chatUnknown.push(callback);
    }

    onCommandUnknown(callback: CommandUnknownCallback) {
        this.eventSubscriptions.commandUnknown.push(callback);
    }

    onCommandError(callback: CommandErrorCallback) {
        this.eventSubscriptions.commandError.push(callback);
    }

    private async triggerItemAddedCallbacks(habit: string, item: string) {
        await Promise.allSettled(
            this.eventSubscriptions.itemAdded.map((cb) => cb(habit, item)),
        );
    }

    private async triggerChatUnknownCallbacks() {
        await Promise.allSettled(
            this.eventSubscriptions.chatUnknown.map((cb) => cb()),
        );
    }

    private async triggerCommandUnknownCallbacks() {
        await Promise.allSettled(
            this.eventSubscriptions.commandUnknown.map((cb) => cb()),
        );
    }

    private async triggerCommandErrorCallbacks() {
        await Promise.allSettled(
            this.eventSubscriptions.commandError.map((cb) => cb()),
        );
    }
}

export type Chat = {
    id: number;
    name: string;
};

export type User = {
    name: string;
    chat_id: number;
    auth: boolean;
};

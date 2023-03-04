import {
    RichTextProperty,
    Schema,
    TitleProperty,
} from '../../../../notion/Schema';

export type Habit = {
    title: string;
    command: string;
};

export const habitSchema = new Schema<Habit>({
    title: new TitleProperty('Categoría'),
    command: new RichTextProperty('Comando'),
});

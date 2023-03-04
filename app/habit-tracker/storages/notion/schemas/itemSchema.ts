import {
    DateProperty,
    RelationProperty,
    Schema,
    TitleProperty,
} from '../../../../notion/Schema';

export type Item = {
    title: string;
    habit_id: string;
    date: Date;
};

export const itemSchema = new Schema<Item>({
    title: new TitleProperty('Item'),
    habit_id: new RelationProperty('Hábito'),
    date: new DateProperty('Fecha'),
});

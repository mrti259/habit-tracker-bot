import {
    CheckboxProperty,
    NumberProperty,
    Schema,
    TitleProperty,
} from '../../../../notion/Schema';
import { User } from '../../../User';

export const userSchema = new Schema<User>({
    name: new TitleProperty('Nombre'),
    chat_id: new NumberProperty('Telegram'),
    auth: new CheckboxProperty('Autorización'),
});

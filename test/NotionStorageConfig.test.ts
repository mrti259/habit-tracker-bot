import { NotionStorage } from '../app/habit-tracker/storages/notion/NotionStorage';
import { assert, createTestSuite } from './utils';

const [test] = createTestSuite('Notion Storage');

let storage: NotionStorage;

test.before(() => {
    storage = new NotionStorage({
        auth_token: process.env['NOTION_TOKEN']!,
        dbhabit_id: process.env['DBHABIT_ID']!,
        dbitem_id: process.env['DBITEM_ID']!,
        dbuser_id: process.env['DBUSER_ID']!,
        cache: true,
    });
});

test.after(async () => {
    await storage.deleteCached();
});

test('Get 0 items', async () => {
    const items = await storage.getItemsFromHabit('Agua');
    assert.equal(items.length, 0);
});

test('Add item', async () => {
    await storage.addItemToHabit('Agua', 'Agua');
    const items = await storage.getItemsFromHabit('Agua');
    assert.equal(items.length, 1);
});

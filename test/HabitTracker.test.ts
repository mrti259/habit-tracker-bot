import {
    HabitTracker,
    RejectionReason,
} from '../app/habit-tracker/HabitTracker';
import { Storage } from '../app/habit-tracker/storages/Storage';
import { assert, createTestSuite } from './utils';

const [test, xtest] = createTestSuite('HabitTracker');

let tracker: HabitTracker;

test.before(() => {
    const storage = new Storage();
    tracker = HabitTracker.forKnownUser(storage);
});

// Command handling - Reporting - Storing

test('Falla con comando desconocido', async () => {
    const accepted = await tracker.accept('start');
    assert(!accepted, 'should be false');
});

test('Obtener reporte vacío', async () => {
    const expectedReport = `Desayuno:
  No hay items
Media mañana:
  No hay items
Almuerzo:
  No hay items
Merienda:
  No hay items
Cena:
  No hay items
Agua:
  0 vasos`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Agregar item a desayuno', async () => {
    const accepted = await tracker.accept('/desayuno café');
    assert(accepted, 'should be true');
    const expectedReport = `Desayuno:
  Café
Media mañana:
  No hay items
Almuerzo:
  No hay items
Merienda:
  No hay items
Cena:
  No hay items
Agua:
  0 vasos`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Agregar item a media mañana', async () => {
    const accepted = await tracker.accept('/media_maniana yogur');
    assert(accepted, 'should be true');
    const expectedReport = `Desayuno:
  No hay items
Media mañana:
  Yogur
Almuerzo:
  No hay items
Merienda:
  No hay items
Cena:
  No hay items
Agua:
  0 vasos`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Agregar item a almuerzo', async () => {
    const accepted = await tracker.accept('/almuerzo ensalada');
    assert(accepted, 'should be true');
    const expectedReport = `Desayuno:
  No hay items
Media mañana:
  No hay items
Almuerzo:
  Ensalada
Merienda:
  No hay items
Cena:
  No hay items
Agua:
  0 vasos`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Agregar item a merienda', async () => {
    const accepted = await tracker.accept('/merienda café');
    assert(accepted, 'should be true');
    const expectedReport = `Desayuno:
  No hay items
Media mañana:
  No hay items
Almuerzo:
  No hay items
Merienda:
  Café
Cena:
  No hay items
Agua:
  0 vasos`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Agregar item a cena', async () => {
    const accepted = await tracker.accept('/cena pollo');
    assert(accepted, 'should be true');
    const expectedReport = `Desayuno:
  No hay items
Media mañana:
  No hay items
Almuerzo:
  No hay items
Merienda:
  No hay items
Cena:
  Pollo
Agua:
  0 vasos`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Agregar un vaso de agua', async () => {
    const accepted = await tracker.accept('/agua');
    assert(accepted, 'should be true');
    const expectedReport = `Desayuno:
  No hay items
Media mañana:
  No hay items
Almuerzo:
  No hay items
Merienda:
  No hay items
Cena:
  No hay items
Agua:
  1 vaso`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Agregar dos items a misma comida', async () => {
    await tracker.accept('/desayuno cafe');
    await tracker.accept('/desayuno tostadas');
    const expectedReport = `Desayuno:
  Cafe
  Tostadas
Media mañana:
  No hay items
Almuerzo:
  No hay items
Merienda:
  No hay items
Cena:
  No hay items
Agua:
  0 vasos`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Sumar dos vasos de agua', async () => {
    await tracker.accept('/agua');
    await tracker.accept('/agua');
    const expectedReport = `Desayuno:
  No hay items
Media mañana:
  No hay items
Almuerzo:
  No hay items
Merienda:
  No hay items
Cena:
  No hay items
Agua:
  2 vasos`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Suscribirse a un comando', async () => {
    let updated = false;
    tracker.onCommand('/start', () => {
        updated = true;
    });
    await tracker.accept('/start');
    assert(updated, 'should be true');
});

test('Correr subscripciones sólo con el comando indicado', async () => {
    let updated = false;
    tracker.onCommand('/start', () => {
        updated = true;
    });
    await tracker.accept('/desayuno cafe');
    assert(!updated, 'should be false');
});

test('Recibir el mensaje entero en subscripciones', async () => {
    let updated = false;
    const message = '/desayuno cafe';
    tracker.onCommand('/desayuno', (msg) => {
        updated = msg === message;
    });
    await tracker.accept(message);
    assert(updated, 'should be true');
});

test('Agregar dos suscripciones a un mismo comando', async () => {
    let updated1 = false;
    let updated2 = false;
    tracker.onCommand('/start', async () => {
        updated1 = true;
    });
    tracker.onCommand('/start', async () => {
        updated2 = true;
    });
    await tracker.accept('/start');
    assert(updated1, 'should be true');
    assert(updated2, 'should be true');
});

test('No agregar items vacíos para comidas', async () => {
    await Promise.allSettled([
        tracker.accept('/desayuno'),
        tracker.accept('/almuerzo'),
        tracker.accept('/merieda'),
        tracker.accept('/cena'),
    ]);
    const expectedReport = `Desayuno:
  No hay items
Media mañana:
  No hay items
Almuerzo:
  No hay items
Merienda:
  No hay items
Cena:
  No hay items
Agua:
  0 vasos`;
    const report = await tracker.report();
    assert.equal(expectedReport, report, report);
});

test('Agregar subscripción a añadir item', async () => {
    let updated = false;
    tracker.onItemAdded(() => {
        updated = true;
    });
    await tracker.accept('/desayuno café');
    assert(updated, 'should be true');
});

test('Agregar subscripción a añadir item sólo cuando se añade item', async () => {
    let updated = false;
    tracker.onItemAdded(() => {
        updated = true;
    });
    await tracker.accept('/desayuno');
    assert(!updated, 'should be false');
});

test('Subscripción al añadir item recibe comida e item', async () => {
    let updated = false;
    tracker.onItemAdded((meal, item) => {
        updated = meal === 'desayuno' && item === 'Café';
    });
    await tracker.accept('/desayuno café');
    assert(updated, 'should be true');
});

test('Al agregar agua, pasar como nombre el hábito', async () => {
    let itemResult;
    tracker.onItemAdded((habit, item) => {
        itemResult = item;
    });
    await tracker.accept('/agua');
    assert.equal(itemResult, 'Agua');
});

xtest('Agregar gimnasio al reporte', async () => {
    const accepted = await tracker.accept('/gimnasio');
    assert(accepted, 'should be true');
    const report = await tracker.report();
    assert(report.includes('Gimnasio'));
});

// User authorization

test('Rechazar solicitudes de un chat desconocido', async () => {
    tracker = HabitTracker.forUnknownUser(new Storage());
    const accepted = await tracker.accept('/desayuno cafe');
    assert(!accepted, 'should be false');
});

test('Rechazar comandos especiales de un chat desconocido', async () => {
    let updated = false;
    tracker = HabitTracker.forUnknownUser(new Storage());
    tracker.onCommand('/desayuno', () => {
        updated = true;
    });
    const accepted = await tracker.accept('/desayuno cafe');
    assert(!accepted, 'should be false');
    assert(!updated, 'should be false');
});

test('No mostrar reporte para un chat desconocido', async () => {
    tracker = HabitTracker.forUnknownUser(new Storage());
    const report = await tracker.report();
    assert.equal(report, HabitTracker.NO_REPORT_MESSAGE, report);
});

test('Identificar chat conocido', async () => {
    tracker = await HabitTracker.forChat(Storage.KNOWN_CHAT, new Storage());
    const accepted = await tracker.accept('/desayuno cafe');
    assert(accepted, 'should be true');
});

test('Identificar chat desconocido', async () => {
    tracker = await HabitTracker.forChat(Storage.UNKNOWN_CHAT, new Storage());
    const accepted = await tracker.accept('/desayuno cafe');
    assert(!accepted, 'should be false');
});

test('Identificar chat no autorizado', async () => {
    tracker = await HabitTracker.forChat(Storage.UNAUTH_CHAT, new Storage());
    const accepted = await tracker.accept('/desayuno cafe');
    assert(!accepted, 'should be false');
});

test('Notificar rechazo por chat desconocido', async () => {
    let reasonResult;
    tracker = HabitTracker.forUnknownUser(new Storage());
    tracker.onRejection((reason) => (reasonResult = reason));
    await tracker.accept('/desayuno cafe');
    assert.equal(reasonResult, RejectionReason.UNKNOWN_CHAT);
});

test('Notificar rechazo por comando desconocido', async () => {
    let reasonResult;
    tracker = HabitTracker.forKnownUser(new Storage());
    tracker.onRejection((reason) => (reasonResult = reason));
    await tracker.accept('desayuno cafe');
    assert.equal(reasonResult, RejectionReason.UNKNOWN_COMMAND);
});

test('Notificar rechazo solo cuando se ejecuta un comando desconocido', async () => {
    let reasonResult;
    tracker = HabitTracker.forKnownUser(new Storage());
    tracker.onRejection((reason) => (reasonResult = reason));
    await tracker.accept('/desayuno cafe');
    assert.equal(reasonResult, undefined);
    await tracker.accept('desayuno cafe');
    assert.equal(reasonResult, RejectionReason.UNKNOWN_COMMAND);
});

test('Notificar rechazo por error en CommandCallback', async () => {
    let reasonResult;
    tracker = HabitTracker.forKnownUser(new Storage());
    tracker.onRejection((reason) => (reasonResult = reason));
    await tracker.accept('/desayuno');
    assert.equal(reasonResult, RejectionReason.COMMAND_ERROR);
});

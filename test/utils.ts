import assert from 'assert';
import baretest from 'baretest';

type Test = ReturnType<typeof baretest>;
type SkipedTest = Test['skip'];

const tests: Array<Test> = [];
let skipped = 0;

function createTestSuite(name: string) {
    const test = baretest(name);
    const skip: SkipedTest = () => {
        skipped++;
    };
    tests.push(test);
    return [test, skip] as const;
}

async function runTests() {
    console.info = () => {};
    for (const test of tests) {
        await test.run();
    }
    console.log();
    console.log(`Skipped: ${skipped}`);
}

export { createTestSuite, runTests, assert };

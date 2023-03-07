import { config } from 'dotenv';

import './app.test';
import { runTests } from './utils';

config({ path: '.env.test' });

runTests();

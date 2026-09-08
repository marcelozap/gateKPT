import assert from 'node:assert/strict';
const response = await fetch(process.env.TEST_URL || 'http://localhost:4174');
assert.equal(response.status, 200);
const html = await response.text();
assert(html.includes('Your daily rhythm'));
assert(!html.includes('Entry code'));
assert(!html.includes('Access is not configured'));
assert(!html.includes('Lock calendar'));
console.log('PASS: public calendar opens without credentials');

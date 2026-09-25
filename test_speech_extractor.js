// Test suite for speechExtractor.js
import { extractTopicsFromTranscript, extractActionItemsFromTranscript, calculateRelativeDate } from './src/utils/speechExtractor.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- Testing Speech Extractor Utilities ---');

// Test Case 1: Spoken commitments with speaker and tomorrow
const speechSample1 = "Good morning everyone. I will complete the backend API integration tomorrow. We also discussed the database schema updates.";
const topics1 = extractTopicsFromTranscript(speechSample1);
const actions1 = extractActionItemsFromTranscript(speechSample1, new Date('2026-09-24T10:00:00Z'));

console.log('Topics 1:', topics1);
console.log('Actions 1:', actions1);

assert(topics1.some(t => t.toLowerCase().includes('database') || t.toLowerCase().includes('schema') || t.toLowerCase().includes('backend')), 'Topic extracted from speech 1');
assert(actions1.length >= 1, 'Action extracted from speech 1');
assert(actions1[0].owner === 'Speaker', 'Owner correctly identified as Speaker for first person commitment');
assert(actions1[0].deadline === '2026-09-25', 'Tomorrow deadline calculated correctly relative to meeting date');
assert(actions1[0].action.toLowerCase().includes('complete the backend api integration'), 'Action text extracted accurately');

// Test Case 2: Multi-person spoken transcript
const speechSample2 = `Marcus will review the security checklist by Friday.
Sarah to deploy the staging environment next week.
We talked about performance optimization and caching.`;

const topics2 = extractTopicsFromTranscript(speechSample2);
const actions2 = extractActionItemsFromTranscript(speechSample2, new Date('2026-09-24T10:00:00Z'));

console.log('Topics 2:', topics2);
console.log('Actions 2:', actions2);

assert(topics2.some(t => t.toLowerCase().includes('performance') || t.toLowerCase().includes('caching')), 'Topics include performance optimization');
assert(actions2.length === 2, 'Two actions extracted for Marcus and Sarah');
assert(actions2[0].owner === 'Marcus', 'Marcus identified as owner');
assert(actions2[0].action.toLowerCase().includes('review the security checklist'), 'Marcus action is correct');
assert(actions2[1].owner === 'Sarah', 'Sarah identified as owner');
assert(actions2[1].action.toLowerCase().includes('deploy the staging environment'), 'Sarah action is correct');

// Test Case 3: Exact Spoken text with no invented info
const speechSample3 = "We discussed the budget allocation.";
const actions3 = extractActionItemsFromTranscript(speechSample3);
assert(actions3.length === 0, 'No false action items invented when only discussion is present');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

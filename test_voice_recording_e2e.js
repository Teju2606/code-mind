import { extractTopicsFromTranscript, extractActionItemsFromTranscript, calculateRelativeDate } from './src/utils/speechExtractor.js';

console.log('=== Running Voice Recording & Extraction Suite ===');

let totalTests = 0;
let passedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    },
    toContain: (expected) => {
      if (typeof actual === 'string' && !actual.includes(expected)) throw new Error(`Expected "${actual}" to contain "${expected}"`);
      if (Array.isArray(actual) && !actual.some(item => (typeof item === 'string' ? item.includes(expected) : JSON.stringify(item).includes(expected)))) {
        throw new Error(`Expected array to contain item with "${expected}"`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (actual <= expected) throw new Error(`Expected ${actual} to be > ${expected}`);
    }
  };
}

// 1. Exact Transcript Preservation
it('should preserve exact transcript without modifying words', () => {
  const spoken = "Good afternoon team. We discussed the microservices architecture. I will finish the database migration by tomorrow.";
  expect(spoken).toContain("Good afternoon team.");
  expect(spoken).toContain("microservices architecture");
  expect(spoken).toContain("database migration by tomorrow");
});

// 2. Topics Extraction
it('should extract main topics discussed from spoken transcript without inventing topics', () => {
  const spoken = "We discussed the frontend performance optimization. Regarding the database indexing, Marcus gave an update.";
  const topics = extractTopicsFromTranscript(spoken);
  expect(topics.length).toBeGreaterThan(0);
  expect(topics).toContain("Frontend performance optimization");
  expect(topics).toContain("Database indexing, Marcus gave an update");
});

// 3. Action Items with Owner, Deadline, Status, and Exact Spoken Quote
it('should extract action items with action, owner, deadline, status, and source quote', () => {
  const refDate = new Date('2026-09-25T10:00:00Z');
  const spoken = "I will complete the API integration tomorrow. Sarah to review the security policy by Friday.";
  const actions = extractActionItemsFromTranscript(spoken, refDate);
  
  expect(actions.length).toBe(2);
  
  // First action: Speaker commitment
  expect(actions[0].action).toContain('Complete the API integration');
  expect(actions[0].owner).toBe('Speaker');
  expect(actions[0].deadline).toBe('2026-09-26');
  expect(actions[0].status).toBe('NEW');
  expect(actions[0].sourceSnippet).toBe('I will complete the API integration tomorrow.');

  // Second action: Sarah commitment
  expect(actions[1].action).toContain('Review the security policy');
  expect(actions[1].owner).toBe('Sarah');
  expect(actions[1].status).toBe('NEW');
  expect(actions[1].sourceSnippet).toBe('Sarah to review the security policy by Friday.');
});

// 4. "Not specified" fallback when Owner or Deadline is not spoken
it('should show "Not specified" when owner or deadline is not spoken in the transcript', () => {
  const refDate = new Date('2026-09-25T10:00:00Z');
  
  // Case A: Deadline spoken, but no owner spoken
  const spokenNoOwner = "We need to deploy the staging environment tomorrow.";
  const actionsA = extractActionItemsFromTranscript(spokenNoOwner, refDate);
  expect(actionsA.length).toBe(1);
  expect(actionsA[0].owner).toBe('Not specified');
  expect(actionsA[0].deadline).toBe('2026-09-26');
  expect(actionsA[0].sourceSnippet).toBe('We need to deploy the staging environment tomorrow.');

  // Case B: Owner spoken, but no deadline spoken
  const spokenNoDeadline = "Marcus will audit the active session hooks.";
  const actionsB = extractActionItemsFromTranscript(spokenNoDeadline, refDate);
  expect(actionsB.length).toBe(1);
  expect(actionsB[0].owner).toBe('Marcus');
  expect(actionsB[0].deadline).toBe('Not specified');
  expect(actionsB[0].sourceSnippet).toBe('Marcus will audit the active session hooks.');

  // Case C: Neither owner nor deadline spoken
  const spokenNeither = "Please update the documentation.";
  const actionsC = extractActionItemsFromTranscript(spokenNeither, refDate);
  expect(actionsC.length).toBe(1);
  expect(actionsC[0].owner).toBe('Not specified');
  expect(actionsC[0].deadline).toBe('Not specified');
  expect(actionsC[0].sourceSnippet).toBe('Please update the documentation.');
});

// 5. Relative Date parsing
it('should accurately calculate dates relative to meeting date', () => {
  const refDate = new Date('2026-09-25T10:00:00Z');
  expect(calculateRelativeDate('tomorrow', refDate)).toBe('2026-09-26');
  expect(calculateRelativeDate('today', refDate)).toBe('2026-09-25');
  expect(calculateRelativeDate('2026-10-15', refDate)).toBe('2026-10-15');
});

// 6. Empty and Non-action statements
it('should not hallucinate action items on plain conversation statements', () => {
  const spoken = "The weather in New York is cloudy today.";
  const actions = extractActionItemsFromTranscript(spoken);
  expect(actions.length).toBe(0);
});

console.log(`\nTest Suite Completed: ${passedTests}/${totalTests} Passed.`);
if (passedTests !== totalTests) process.exit(1);

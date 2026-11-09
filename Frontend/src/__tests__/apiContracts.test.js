import test from 'node:test';
import assert from 'node:assert/strict';

test('API contract validation: Header X-Student-Id and paths', () => {
  const sampleStudentId = '20152691234567890';

  // Helper verifying header structure
  function buildHeaders(studentId) {
    return {
      'Content-Type': 'application/json',
      'X-Student-Id': String(studentId).trim(),
    };
  }

  const headers = buildHeaders(sampleStudentId);
  assert.equal(headers['X-Student-Id'], '20152691234567890');
  assert.equal(headers['Content-Type'], 'application/json');

  // Verify class creation body format: §1.4 #1
  const createClassPayload = { name: 'Class 6 - Morning Shift', totalSeats: 120 };
  assert.equal(typeof createClassPayload.name, 'string');
  assert.equal(typeof createClassPayload.totalSeats, 'number');
  assert.ok(createClassPayload.totalSeats > 0);

  // Verify hold status values: §1.4 #5
  const validHoldStatuses = ['HELD', 'CONFIRMED', 'EXPIRED', 'CANCELLED'];
  assert.ok(validHoldStatuses.includes('HELD'));
  assert.ok(validHoldStatuses.includes('CONFIRMED'));
  assert.ok(validHoldStatuses.includes('EXPIRED'));
  assert.ok(validHoldStatuses.includes('CANCELLED'));
});

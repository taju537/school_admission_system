import test from 'node:test';
import assert from 'node:assert/strict';

function validateStudentId(id) {
  if (!id) return { isValid: false, message: '১৭ অঙ্কের জন্ম নিবন্ধন নম্বর লিখুন' };
  const cleaned = String(id).trim();
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, message: 'শুধুমাত্র সংখ্যা (Digits) গ্রহণযোগ্য' };
  }
  if (cleaned.length < 17) {
    return { isValid: false, message: `আরও ${17 - cleaned.length}টি অঙ্ক প্রয়োজন (${cleaned.length}/১৭)` };
  }
  if (cleaned.length > 17) {
    return { isValid: false, message: `১৭ অঙ্কের বেশি হয়েছে (${cleaned.length}/১৭)` };
  }
  return { isValid: true, message: 'সঠিক ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর ✅' };
}

test('Validates 17-digit birth registration number', () => {
  // Official example from PDF §1.4
  const officialSample = '20152691234567890';
  const res1 = validateStudentId(officialSample);
  assert.equal(res1.isValid, true);
  assert.equal(res1.message, 'সঠিক ১৭ অঙ্কের জন্ম নিবন্ধন নম্বর ✅');

  // Too short (16 digits)
  const tooShort = '2015269123456789';
  const res2 = validateStudentId(tooShort);
  assert.equal(res2.isValid, false);
  assert.ok(res2.message.includes('আরও 1টি অঙ্ক প্রয়োজন'));

  // Too long (18 digits)
  const tooLong = '201526912345678901';
  const res3 = validateStudentId(tooLong);
  assert.equal(res3.isValid, false);
  assert.ok(res3.message.includes('১৭ অঙ্কের বেশি হয়েছে'));

  // Non-numeric characters
  const nonNumeric = '2015269123456789A';
  const res4 = validateStudentId(nonNumeric);
  assert.equal(res4.isValid, false);
  assert.equal(res4.message, 'শুধুমাত্র সংখ্যা (Digits) গ্রহণযোগ্য');

  // Empty string
  const empty = '';
  const res5 = validateStudentId(empty);
  assert.equal(res5.isValid, false);
});


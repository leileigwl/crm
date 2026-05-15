import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCustomerWithGeneratedCode,
  CUSTOMER_CODE_RETRY_LIMIT,
  generateCustomerCode,
  isCustomerCodeConflict,
} from '@/lib/customer-code';

test('generateCustomerCode returns expected format', () => {
  const code = generateCustomerCode(new Date('2026-05-15T08:00:00.000Z'));
  assert.match(code, /^CRM-20260515-[A-Z0-9]{8}$/);
});

test('generateCustomerCode produces unique values across a large sample', () => {
  const codes = new Set<string>();

  for (let index = 0; index < 2000; index += 1) {
    codes.add(generateCustomerCode(new Date('2026-05-15T08:00:00.000Z')));
  }

  assert.equal(codes.size, 2000);
});

test('generateCustomerCode uses UTC date segment consistently', () => {
  const code = generateCustomerCode(new Date('2026-12-31T23:59:59.999Z'));
  assert.match(code, /^CRM-20261231-[A-Z0-9]{8}$/);
});

test('isCustomerCodeConflict only matches customer_code unique violations', () => {
  assert.equal(
    isCustomerCodeConflict({
      code: '23505',
      message: 'duplicate key value violates unique constraint "customers_customer_code_key"',
    }),
    true
  );

  assert.equal(
    isCustomerCodeConflict({
      code: '23505',
      message: 'duplicate key value violates unique constraint "crm_users_email_key"',
    }),
    false
  );

  assert.equal(
    isCustomerCodeConflict({
      code: '22001',
      message: 'value too long',
    }),
    false
  );

  assert.equal(
    isCustomerCodeConflict({
      code: '23505',
      details: 'Key (customer_code)=(CRM-20260515-ABC12345) already exists.',
    }),
    true
  );
});

test('createCustomerWithGeneratedCode retries on customer_code conflicts', async () => {
  let attempts = 0;

  const result = await createCustomerWithGeneratedCode({
    now: new Date('2026-05-15T08:00:00.000Z'),
    insertCustomer: async (customerCode) => {
      attempts += 1;

      if (attempts < 3) {
        return {
          data: null,
          error: {
            code: '23505',
            message: 'duplicate key value violates unique constraint "customers_customer_code_key"',
          },
        };
      }

      return {
        data: { id: 'customer-1', customer_code: customerCode },
        error: null,
      };
    },
  });

  assert.equal(attempts, 3);
  assert.match(result.customerCode, /^CRM-20260515-[A-Z0-9]{8}$/);
  assert.ok(result.data);
  assert.equal(result.data.id, 'customer-1');
});

test('createCustomerWithGeneratedCode throws immediately on non-conflict errors', async () => {
  await assert.rejects(
    createCustomerWithGeneratedCode({
      insertCustomer: async () => ({
        data: null,
        error: {
          code: '42501',
          message: 'permission denied',
        },
      }),
    }),
    (error: unknown) => {
      assert.deepEqual(error, {
        code: '42501',
        message: 'permission denied',
      });
      return true;
    }
  );
});

test('createCustomerWithGeneratedCode stops after retry limit', async () => {
  let attempts = 0;

  await assert.rejects(
    createCustomerWithGeneratedCode({
      maxAttempts: CUSTOMER_CODE_RETRY_LIMIT,
      insertCustomer: async () => {
        attempts += 1;
        return {
          data: null,
          error: {
            code: '23505',
            details: 'Key (customer_code)=(CRM-20260515-XXXXXX) already exists.',
          },
        };
      },
    })
  );

  assert.equal(attempts, CUSTOMER_CODE_RETRY_LIMIT);
});

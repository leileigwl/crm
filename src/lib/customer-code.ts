import { randomBytes } from 'crypto';

export const CUSTOMER_CODE_PREFIX = 'CRM';
export const CUSTOMER_CODE_SUFFIX_LENGTH = 8;
export const CUSTOMER_CODE_RETRY_LIMIT = 5;

type InsertSuccessResult<T> = {
  data: T;
  error: null;
};

type InsertFailureResult = {
  data: null;
  error: unknown;
};

type CreateCustomerWithCodeParams<T> = {
  insertCustomer: (customerCode: string) => Promise<InsertSuccessResult<T> | InsertFailureResult>;
  now?: Date;
  maxAttempts?: number;
};

function hasInsertSuccessData<T>(
  result: InsertSuccessResult<T> | InsertFailureResult
): result is InsertSuccessResult<T> {
  return result.error === null && result.data !== null;
}

function formatDateSegment(now: Date): string {
  return now.toISOString().slice(0, 10).replace(/-/g, '');
}

function createRandomSegment(): string {
  return randomBytes(CUSTOMER_CODE_SUFFIX_LENGTH)
    .toString('base64url')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, CUSTOMER_CODE_SUFFIX_LENGTH);
}

export function generateCustomerCode(now: Date = new Date()): string {
  return `${CUSTOMER_CODE_PREFIX}-${formatDateSegment(now)}-${createRandomSegment()}`;
}

export function isCustomerCodeConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as {
    code?: string;
    message?: string;
    details?: string;
  };

  const message = `${maybeError.message ?? ''} ${maybeError.details ?? ''}`.toLowerCase();
  return maybeError.code === '23505' && message.includes('customer_code');
}

export async function createCustomerWithGeneratedCode<T>({
  insertCustomer,
  now = new Date(),
  maxAttempts = CUSTOMER_CODE_RETRY_LIMIT,
}: CreateCustomerWithCodeParams<T>): Promise<{ customerCode: string; data: T }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const customerCode = generateCustomerCode(now);
    const result = await insertCustomer(customerCode);

    if (hasInsertSuccessData(result)) {
      return { customerCode, data: result.data };
    }

    if (isCustomerCodeConflict(result.error)) {
      lastError = result.error;
      continue;
    }

    throw result.error;
  }

  throw lastError ?? new Error('Failed to generate unique customer code');
}

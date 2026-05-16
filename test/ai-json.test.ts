import test from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonObject, normalizeNullableString } from '@/lib/ai-json';

test('extractJsonObject parses direct json', () => {
  assert.deepEqual(extractJsonObject('{"summary":"已沟通","followUpAt":null}'), {
    summary: '已沟通',
    followUpAt: null,
  });
});

test('extractJsonObject parses fenced json', () => {
  assert.deepEqual(extractJsonObject('```json\n{"name":"张三"}\n```'), {
    name: '张三',
  });
});

test('extractJsonObject parses wrapped json', () => {
  assert.deepEqual(extractJsonObject('结果如下：\n{"city":"上海"}\n请查收'), {
    city: '上海',
  });
});

test('normalizeNullableString trims and limits text', () => {
  assert.equal(normalizeNullableString('  第一行\n第二行  ', 20), '第一行 第二行');
  assert.equal(normalizeNullableString('   '), null);
  assert.equal(normalizeNullableString(123), null);
});

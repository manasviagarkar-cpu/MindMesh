import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeInput,
  parseTaskFromResponse,
  getCallCount,
  isRateLimited,
  getRemainingCalls
} from './gemini';

// Mock sessionStorage in environments where it is undefined (e.g. CLI Node test runs)
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    clear: () => {
      store = {};
    },
  };
})();

global.sessionStorage = sessionStorageMock;

describe('Gemini AI Client Utilities', () => {
  beforeEach(() => {
    sessionStorageMock.clear();
  });

  describe('sanitizeInput', () => {
    it('should strip HTML tags from input string', () => {
      const input = '<script>alert("xss")</script>Hello <b>World</b>';
      const expected = 'alert(&quot;xss&quot;)Hello World';
      expect(sanitizeInput(input)).toBe(expected);
    });

    it('should escape dangerous characters (<, >, ", \', `)', () => {
      expect(sanitizeInput('a < b')).toBe('a &lt; b');
      expect(sanitizeInput('a > b')).toBe('a &gt; b');
      expect(sanitizeInput('a " b')).toBe('a &quot; b');
      expect(sanitizeInput("a ' b")).toBe('a &#39; b');
      expect(sanitizeInput('a ` b')).toBe('a &#96; b');
    });

    it('should trim surrounding whitespace', () => {
      const input = '   hello world   ';
      expect(sanitizeInput(input)).toBe('hello world');
    });

    it('should truncate input to 2000 characters', () => {
      const longInput = 'a'.repeat(2500);
      expect(sanitizeInput(longInput)).toHaveLength(2000);
    });

    it('should return empty string for non-string inputs', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput({})).toBe('');
    });
  });

  describe('parseTaskFromResponse', () => {
    it('should parse a valid add_task JSON block enclosed in markdown blocks', () => {
      const text = 'Sure, here is your task:\n```json\n{\n  "action": "add_task",\n  "task": "Submit report",\n  "deadline": "2026-06-30",\n  "priority": "HIGH",\n  "category": "work",\n  "estimatedHours": 2\n}\n```\nLet me know if you need anything else.';
      const result = parseTaskFromResponse(text);
      expect(result).not.toBeNull();
      expect(result.task).toBe('Submit report');
      expect(result.deadline).toBe('2026-06-30');
      expect(result.priority).toBe('HIGH');
      expect(result.category).toBe('work');
      expect(result.estimatedHours).toBe(2);
    });

    it('should return null if the JSON block does not have add_task action', () => {
      const text = '```json\n{\n  "action": "some_other_action",\n  "task": "Submit report",\n  "deadline": "2026-06-30"\n}\n```';
      expect(parseTaskFromResponse(text)).toBeNull();
    });

    it('should return null if JSON block is missing task or deadline', () => {
      const textNoDeadline = '```json\n{\n  "action": "add_task",\n  "task": "Submit report"\n}\n```';
      const textNoTask = '```json\n{\n  "action": "add_task",\n  "deadline": "2026-06-30"\n}\n```';
      expect(parseTaskFromResponse(textNoDeadline)).toBeNull();
      expect(parseTaskFromResponse(textNoTask)).toBeNull();
    });

    it('should return null if there is no JSON block', () => {
      const text = 'Just some friendly chat here without JSON code blocks.';
      expect(parseTaskFromResponse(text)).toBeNull();
    });

    it('should return null if JSON block contains invalid JSON syntax', () => {
      const text = '```json\n{\n  "action": "add_task"\n  "task": "broken json due to missing comma"\n}\n```';
      expect(parseTaskFromResponse(text)).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('should start with 0 call count', () => {
      expect(getCallCount()).toBe(0);
      expect(isRateLimited()).toBe(false);
      expect(getRemainingCalls()).toBe(20);
    });

    it('should respect remaining calls counting down', () => {
      sessionStorageMock.setItem('mindmesh_call_count', '5');
      expect(getCallCount()).toBe(5);
      expect(isRateLimited()).toBe(false);
      expect(getRemainingCalls()).toBe(15);
    });

    it('should indicate rate limited when call count reaches 20', () => {
      sessionStorageMock.setItem('mindmesh_call_count', '20');
      expect(getCallCount()).toBe(20);
      expect(isRateLimited()).toBe(true);
      expect(getRemainingCalls()).toBe(0);
    });

    it('should handle call count values exceeding the rate limit safely', () => {
      sessionStorageMock.setItem('mindmesh_call_count', '25');
      expect(getCallCount()).toBe(25);
      expect(isRateLimited()).toBe(true);
      expect(getRemainingCalls()).toBe(0);
    });
  });
});

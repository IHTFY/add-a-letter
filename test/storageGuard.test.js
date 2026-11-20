// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

const boom = () => {
	throw new DOMException('The operation is insecure.', 'SecurityError');
};

describe('storage guard', () => {
	it('keeps values for the visit when reading storage throws', async () => {
		vi.stubGlobal('localStorage', { getItem: boom, setItem: boom });
		await import('../src/lib/storageGuard.js');
		expect(() => localStorage.getItem('a')).not.toThrow();
		localStorage.setItem('a', '1');
		expect(localStorage.getItem('a')).toBe('1');
		expect(localStorage.getItem('b')).toBeNull();
		expect(localStorage.length).toBe(1);
		expect(localStorage.key(0)).toBe('a');
		localStorage.removeItem('a');
		expect(localStorage.getItem('a')).toBeNull();
	});

	it('replaces storage that throws when reached', async () => {
		Object.defineProperty(window, 'localStorage', { configurable: true, get: boom });
		await import('../src/lib/storageGuard.js');
		localStorage.setItem('a', '1');
		expect(localStorage.getItem('a')).toBe('1');
	});

	it('leaves working storage alone', async () => {
		const original = localStorage;
		await import('../src/lib/storageGuard.js');
		expect(localStorage).toBe(original);
	});

	it('loads before the theme package at each entry point', () => {
		for (const file of ['src/routes/+page.svelte', 'src/lib/components/Game.svelte']) {
			const imports = [...readFileSync(file, 'utf8').matchAll(/import[^;]*?['"]([^'"]+)['"]/g)];
			expect(imports[0][1], file).toBe('#lib/storageGuard.js');
		}
	});
});

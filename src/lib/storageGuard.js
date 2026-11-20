/**
 * Stands in for local storage that cannot be read, such as when the browser blocks site data.
 * It keeps values for this visit only.
 * @returns {Storage}
 */
function createMemoryStorage() {
	/** @type {Map<string, string>} */
	const values = new Map();
	return {
		get length() {
			return values.size;
		},
		key: (index) => [...values.keys()][index] ?? null,
		getItem: (key) => values.get(String(key)) ?? null,
		setItem: (key, value) => void values.set(String(key), String(value)),
		removeItem: (key) => void values.delete(String(key)),
		clear: () => values.clear()
	};
}

/**
 * Packages that read local storage as they load, such as the theme package, throw when the
 * browser refuses access, which keeps the page from starting. Run this before they load.
 * @param {Window} [win]
 */
export function guardStorage(win = window) {
	try {
		win.localStorage.getItem('ihtfy-storage-check');
	} catch {
		try {
			Object.defineProperty(win, 'localStorage', {
				value: createMemoryStorage(),
				configurable: true
			});
		} catch {
			// The property cannot be replaced: nothing more to do.
		}
	}
}

if (typeof window !== 'undefined') guardStorage();

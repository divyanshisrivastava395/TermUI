import { describe, expect, it } from 'vitest';
import { ShortcutHelpOverlay } from './ShortcutHelpOverlay.js'; // The file is exported as .tsx but typically imported as .js

describe('ShortcutHelpOverlay', () => {
    it('returns a function component', () => {
        expect(typeof ShortcutHelpOverlay).toBe('function');
    });
});

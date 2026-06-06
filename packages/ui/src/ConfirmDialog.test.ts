import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog.js';
import { Screen } from '@termuijs/core';

describe('ConfirmDialog', () => {
    it('is initially hidden', () => {
        const dialog = new ConfirmDialog({ message: 'Are you sure?' });
        expect(dialog.visible).toBe(false);
    });

    it('shows and hides correctly', () => {
        const dialog = new ConfirmDialog({ message: 'Test' });
        dialog.show();
        expect(dialog.visible).toBe(true);
        dialog.hide();
        expect(dialog.visible).toBe(false);
    });

    it('selects confirm and cancel', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        const dialog = new ConfirmDialog({ message: 'Test', onConfirm, onCancel });
        
        dialog.show();
        dialog.selectCancel();
        dialog.confirm();
        
        expect(onCancel).toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
        expect(dialog.visible).toBe(false);
    });

    it('toggles selection', () => {
        const onConfirm = vi.fn();
        const dialog = new ConfirmDialog({ message: 'Test', onConfirm });
        
        dialog.show();
        dialog.toggleSelection(); // -> cancel
        dialog.toggleSelection(); // -> confirm
        dialog.confirm();
        
        expect(onConfirm).toHaveBeenCalled();
    });

    it('renders dialog when visible', () => {
        const dialog = new ConfirmDialog({ message: 'Are you sure?' });
        dialog.show();
        
        const screen = new Screen(40, 20);
        dialog.updateRect({ x: 0, y: 0, width: 40, height: 20 });
        dialog.render(screen);
        
        const rows = screen.back.map(r => r.map(c => c.char).join(''));
        expect(rows.join('\n')).toContain('Are you sure?');
        expect(rows.join('\n')).toContain('[Yes]');
        expect(rows.join('\n')).toContain('  No  ');
    });
});

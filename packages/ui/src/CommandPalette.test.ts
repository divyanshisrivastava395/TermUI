import { describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './CommandPalette.js';
import { Screen, caps } from '@termuijs/core';

describe('CommandPalette', () => {
    it('is initially hidden', () => {
        const palette = new CommandPalette([]);
        expect(palette.visible).toBe(false);
    });

    it('shows and hides correctly', () => {
        const palette = new CommandPalette([]);
        palette.show();
        expect(palette.visible).toBe(true);
        palette.hide();
        expect(palette.visible).toBe(false);
        palette.toggle();
        expect(palette.visible).toBe(true);
    });

    it('filters commands', () => {
        const cmd1 = vi.fn();
        const cmd2 = vi.fn();
        const palette = new CommandPalette([
            { id: '1', label: 'Save File', action: cmd1 },
            { id: '2', label: 'Quit', action: cmd2 }
        ]);
        
        palette.show();
        palette.insertChar('s');
        palette.insertChar('a');
        palette.insertChar('v');
        
        // Confirm should trigger cmd1
        palette.confirm();
        expect(cmd1).toHaveBeenCalled();
        expect(cmd2).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation', () => {
        const palette = new CommandPalette([
            { id: '1', label: 'One', action: () => {} },
            { id: '2', label: 'Two', action: () => {} }
        ]);
        
        palette.show();
        const stopPropagation = vi.fn();

        palette.handleKey({ key: 'down', ctrl: false, alt: false, shift: false, stopPropagation } as any);
        palette.handleKey({ key: 'up', ctrl: false, alt: false, shift: false, stopPropagation } as any);
        palette.handleKey({ key: 'escape', ctrl: false, alt: false, shift: false, stopPropagation } as any);
        
        expect(palette.visible).toBe(false);
        expect(stopPropagation).toHaveBeenCalled();
    });

    it('handles Ctrl+P to toggle', () => {
        const palette = new CommandPalette([]);
        const stopPropagation = vi.fn();
        palette.handleKey({ key: 'p', ctrl: true, alt: false, shift: false, stopPropagation } as any);
        expect(palette.visible).toBe(true);
    });

    it('handles backspace', () => {
        const palette = new CommandPalette([]);
        palette.show();
        palette.insertChar('a');
        palette.deleteBack();
    });

    it('renders when visible', () => {
        vi.spyOn(caps, 'unicode', 'get').mockReturnValue(false);
        const palette = new CommandPalette([{ id: '1', label: 'TestCmd', action: () => {} }]);
        palette.show();
        const screen = new Screen(80, 24);
        palette.updateRect({ x: 0, y: 0, width: 80, height: 24 });
        palette.render(screen);
        
        const output = screen.back.map(r => r.map(c => c.char).join(''));
        expect(output.join('\n')).toContain('TestCmd');
    });
});

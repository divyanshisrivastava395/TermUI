import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NotificationStore, NotificationCenter, useNotifications, notifications } from './NotificationCenter.js';
import { Screen, caps } from '@termuijs/core';

describe('NotificationCenter', () => {
    beforeEach(() => {
        // Clear singleton store
        notifications.dismissAll();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('NotificationStore', () => {
        it('pushes and dismisses notifications', () => {
            const id = notifications.push('Hello', 'info');
            expect(notifications.notifications).toHaveLength(1);
            expect(notifications.notifications[0].message).toBe('Hello');

            notifications.dismiss(id);
            expect(notifications.notifications).toHaveLength(0);
        });

        it('auto dismisses after durationMs', () => {
            vi.useFakeTimers();
            const id = notifications.push('Test', 'info', 1000);
            expect(notifications.notifications).toHaveLength(1);

            vi.advanceTimersByTime(1000);
            expect(notifications.notifications).toHaveLength(0);
            vi.useRealTimers();
        });

        it('subscribes and unsubscribes', () => {
            const fn = vi.fn();
            const unsub = notifications.subscribe(fn);

            notifications.push('Hello');
            expect(fn).toHaveBeenCalledTimes(1);

            unsub();
            notifications.push('World');
            expect(fn).toHaveBeenCalledTimes(1); // Should not increase
        });
    });

    describe('NotificationCenter Widget', () => {
        it('renders notifications with correct icons', () => {
            vi.spyOn(caps, 'unicode', 'get').mockReturnValue(false);
            
            notifications.push('Info Msg', 'info');
            notifications.push('Success Msg', 'success');
            
            const widget = new NotificationCenter({ width: 20 });
            const screen = new Screen(40, 10);
            widget.updateRect({ x: 0, y: 0, width: 40, height: 10 });
            widget.render(screen);

            const row1 = screen.back[1].map(c => c.char).join('');
            const row2 = screen.back[2].map(c => c.char).join('');

            expect(row1).toContain('i Info Msg');
            expect(row2).toContain('+ Success Msg');
            
            widget.unmount();
        });
    });
});

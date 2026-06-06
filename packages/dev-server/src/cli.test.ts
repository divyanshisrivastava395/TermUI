import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { DevServer } from './server.js';

vi.mock('./server.js', () => {
    return {
        DevServer: vi.fn().mockImplementation(() => ({
            start: vi.fn(),
            stop: vi.fn()
        }))
    };
});

describe('CLI', () => {
    let originalArgv: string[];

    beforeEach(() => {
        originalArgv = process.argv;
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.argv = originalArgv;
    });

    it('parses arguments and starts dev server', async () => {
        process.argv = ['node', 'cli.ts', './my-dir', '--entry', 'src/main.ts'];
        
        // Dynamically import to execute the cli script
        // We use a query parameter to avoid module caching issues if run multiple times
        await import('./cli.ts?t=' + Date.now());

        expect(DevServer).toHaveBeenCalledWith(expect.objectContaining({
            rootDir: './my-dir',
            entry: 'src/main.ts',
            devTools: true
        }));
    });
});

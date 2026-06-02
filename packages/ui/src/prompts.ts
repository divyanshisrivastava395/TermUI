// ─────────────────────────────────────────────────────
// @termuijs/ui — Imperative Prompts
//
// Pure Node.js readline-based prompts for CLI scripts
// that don't need a full TUI app. Zero dependency on
// @termuijs/core, @termuijs/widgets, or @termuijs/jsx.
// ─────────────────────────────────────────────────────


import * as readline from 'readline';

export class NonInteractiveError extends Error {
    constructor() {
        super('Prompts require an interactive TTY. stdin is not a TTY.');
        this.name = 'NonInteractiveError';
    }
}
export class AbortError extends Error {
    constructor() {
        super('Prompt aborted');
        this.name = 'AbortError';
    }
}
export interface TextPromptOptions {
    message: string;
    placeholder?: string;
    validate?: (value: string) => string | null;
    default?: string;
    signal?: AbortSignal;
}

export interface ConfirmPromptOptions {
    message: string;
    default?: boolean;
    signal?: AbortSignal;
}
export interface SelectPromptOptions<T = string> {
    message: string;
    options: Array<{ label: string; value: T }>;
    default?: T;
    signal?: AbortSignal;
}



async function promptText(options: TextPromptOptions): Promise<string> {
    if (!process.stdin.isTTY) throw new NonInteractiveError();
if (options.signal?.aborted) {
    throw new AbortError();
}
    const defaultHint = options.default ? ` (${options.default})` : '';
    const placeholder = options.placeholder ? ` [${options.placeholder}]` : '';

    return new Promise((resolve, reject)  => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
const onAbort = () => {
    rl.close();
    reject(new AbortError());
};

options.signal?.addEventListener('abort', onAbort);
        const ask = () => {
            rl.question(`${options.message}${defaultHint}${placeholder}: `, (answer) => {
                const value = answer.trim() || options.default || '';
                if (options.validate) {
                    const error = options.validate(value);
                    if (error) {
                        process.stdout.write(`  ${error}\n`);
                        ask();
                        return;
                    }
                }
                rl.close();
                options.signal?.removeEventListener('abort', onAbort);
                resolve(value);
            });
        };

        ask();
    });
}

async function promptConfirm(options: ConfirmPromptOptions): Promise<boolean> {
    if (!process.stdin.isTTY) throw new NonInteractiveError();

if (options.signal?.aborted) {
    throw new AbortError();
}

    const hint = options.default === true ? 'Y/n' : options.default === false ? 'y/N' : 'y/n';

    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
const onAbort = () => {
    rl.close();
    reject(new AbortError());
};

options.signal?.addEventListener('abort', onAbort);
        rl.question(`${options.message} [${hint}]: `, (answer) => {
            rl.close();
            const a = answer.trim().toLowerCase();
            if (a === 'y' || a === 'yes') { resolve(true); return; }
            if (a === 'n' || a === 'no') { resolve(false); return; }
            if (a === '' && options.default !== undefined) { resolve(options.default); return; }
           options.signal?.removeEventListener('abort', onAbort);
            resolve(false);
        });
    });
}

async function promptSelect<T = string>(options: SelectPromptOptions<T>): Promise<T> {
    if (!process.stdin.isTTY) throw new NonInteractiveError();
if (options.signal?.aborted) {
    throw new AbortError();
}
    const { options: choices, default: defaultValue } = options;
    process.stdout.write(`${options.message}\n`);
    choices.forEach((opt, i) => {
        const isDefault = opt.value === defaultValue;
        process.stdout.write(`  ${i + 1}. ${opt.label}${isDefault ? ' (default)' : ''}\n`);
    });

  return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
const onAbort = () => {
    rl.close();
    reject(new AbortError());
};

options.signal?.addEventListener('abort', onAbort);
        const ask = () => {
            rl.question(`Enter number (1-${choices.length}): `, (answer) => {
                const trimmed = answer.trim();
                if (trimmed === '' && defaultValue !== undefined) {
                    rl.close();
                    
options.signal?.removeEventListener('abort', onAbort);
                    resolve(defaultValue);
                    return;
                }
                const n = parseInt(trimmed, 10);
                if (!isNaN(n) && n >= 1 && n <= choices.length) {
                    rl.close();
                    options.signal?.removeEventListener('abort', onAbort);
                    resolve(choices[n - 1].value);
                    return;
                }
                process.stdout.write(`  Invalid choice. Enter a number 1-${choices.length}.\n`);
                ask();
            });
        };

        ask();
    });
}

/**
 * Imperative prompts for CLI scripts — no widget stack required.
 *
 * ```ts
 * const name = await prompt.text({ message: 'Project name:', default: 'my-app' });
 * const ok = await prompt.confirm({ message: 'Continue?', default: true });
 * const pkg = await prompt.select({ message: 'Package manager:', options: [
 *     { label: 'pnpm', value: 'pnpm' },
 *     { label: 'npm', value: 'npm' },
 * ]});
 * ```
 *
 * Throws `NonInteractiveError` when stdin is not a TTY.
 */

export const prompt = {
    text: promptText,
    confirm: promptConfirm,
    select: promptSelect,
} as const;



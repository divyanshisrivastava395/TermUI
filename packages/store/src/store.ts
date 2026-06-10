// ─────────────────────────────────────────────────────
// @termuijs/store — Zustand-like State Management
//
// Minimal, powerful state management for terminal apps.
// Create stores with actions, use them in components
// with selector-based subscriptions.
//
// Usage:
//   const useCounter = createStore((set) => ({
//       count: 0,
//       increment: () => set(s => ({ count: s.count + 1 })),
//       reset: () => set({ count: 0 }),
//   }));
//
//   function Counter() {
//       const count = useCounter(s => s.count);
//       const increment = useCounter(s => s.increment);
//       useInput((key) => { if (key === '+') increment(); });
//       return <Text>Count: {count}</Text>;
//   }
// ─────────────────────────────────────────────────────
import { produce } from 'immer';
import { useState, useEffect, useRef } from '@termuijs/jsx';


// ── Batch Mechanism ──

let _batchDepth = 0;
// Map store instance to { listeners, prevState, nextState }
const _batchStores = new Map<Set<any>, { prevState: any; nextState: any }>();

/**
 * Batch multiple state updates into a single render pass.
 *
 * Coalesces all setState calls within the same microtask tick
 * into a single reconciler update, reducing unnecessary re-renders.
 *
 * ```tsx
 * // Without batch: 3 re-renders
 * store.setState({ x: 1 });
 * store.setState({ y: 2 });
 * store.setState({ z: 3 });
 *
 * // With batch: 1 re-render
 * batch(() => {
 *     store.setState({ x: 1 });
 *     store.setState({ y: 2 });
 *     store.setState({ z: 3 });
 * });
 * ```
 */
export function batch(fn: () => void): void {
    _batchDepth++;
    let threw = false;
    try {
        fn();
    } catch (err) {
        threw = true;
        throw err;
    } finally {
        _batchDepth--;
        if (_batchDepth === 0) {
            if (threw) {
                _batchStores.clear(); // Don't notify listeners with partial state
            } else {
                queueMicrotask(() => {
                    const stores = Array.from(_batchStores.entries());
                    _batchStores.clear();
                    for (const [listeners, { prevState, nextState }] of stores) {
                        for (const listener of listeners) {
                            listener(nextState, prevState);
                        }
                    }
                });
            }
        }
    }
}

// ── Types ──

export type SetState<T> = (
    partial: Partial<T> | ((state: T) => Partial<T>),
) => void;

export type GetState<T> = () => T;

export type StateCreator<T> = (
    set: SetState<T>,
    get: GetState<T>,
) => T;

export type Selector<T, U> = (state: T) => U;

export type Listener<T> = (state: T, prevState: T) => void;

export interface Store<T> {
    getState(): T;
    setState: SetState<T>;
    mutate(recipe: (draft: T) => void): void;
    subscribe(listener: Listener<T>): () => void;
    destroy(): void;
}
// ── Store Implementation ──

/**
 * Create a new store. Returns a hook function that can be
 * called inside components with an optional selector.
 *
 * ```tsx
 * const useAppStore = createStore((set, get) => ({
 *     count: 0,
 *     todos: [] as string[],
 *     increment: () => set(s => ({ count: s.count + 1 })),
 *     addTodo: (text: string) => set(s => ({
 *         todos: [...s.todos, text]
 *     })),
 *     get totalItems() { return get().todos.length; },
 * }));
 *
 * // In a component:
 * function Counter() {
 *     const count = useAppStore(s => s.count);
 *     return <Text>Count: {count}</Text>;
 * }
 * ```
 */
export function createStore<T extends object>(
    creator: StateCreator<T>,
): UseStore<T> {
    const listeners = new Set<Listener<T>>();

    let state: T;

    const setState: SetState<T> = (partial) => {
        const prevState = state;
        const nextPartial = typeof partial === 'function'
            ? (partial as (state: T) => Partial<T>)(state)
            : partial;
        const nextState = { ...state, ...nextPartial };

        // Only notify if at least one key's value actually changed
        const hasChanged = Object.keys(nextPartial).some(
            key => !Object.is((state as any)[key], (nextState as any)[key])
        );
        if (hasChanged) {
            state = nextState;
            if (_batchDepth > 0) {
                // We're in a batch: defer listener notifications and track the final state
                const existing = _batchStores.get(listeners);
                if (!existing) {
                    _batchStores.set(listeners, { prevState, nextState });
                } else {
                    // Update to the new nextState, but keep the original prevState
                    existing.nextState = nextState;
                }
            } else {
                // Not in a batch: notify immediately
                for (const listener of listeners) {
                    listener(state, prevState);
                }
            }
        }
    };

    const getState: GetState<T> = () => state;

    const subscribe = (listener: Listener<T>): (() => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    };

    const destroy = (): void => {
        listeners.clear();
    };
const mutate = (recipe: (draft: T) => void): void => {
    const prevState = state;
const nextState = produce(state, (draft) => {
    recipe(draft as T);
});
   if (Object.is(prevState, nextState)) {
        return;
    } 
    state = nextState;

    if (_batchDepth > 0) {
        const existing = _batchStores.get(listeners);

        if (!existing) {
            _batchStores.set(listeners, {
                prevState,
                nextState,
            });
        } else {
            existing.nextState = nextState;
        }
    } else {
        for (const listener of listeners) {
            listener(nextState, prevState);
        }
    }
};
    // Initialize state
    state = creator(setState, getState);

    const store: Store<T> = {
    getState,
    setState,
    subscribe,
    destroy,
    mutate
};

    // Create the hook function
    function useStore(): T;
    function useStore<U>(selector: Selector<T, U>): U;
    function useStore<U>(selector?: Selector<T, U>): T | U {
        const select = selector ?? ((s: T) => s as unknown as U);

        // Use useState to trigger re-renders
        const [selectedState, setSelectedState] = useState(() => select(store.getState()));
        const selectorRef = useRef(select);
        selectorRef.current = select;

       useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
        const newSelected = selectorRef.current(newState);

        setSelectedState(prev =>
            Object.is(prev, newSelected) 
            ? prev
             : newSelected
        );
    });

    return unsubscribe;
}, []);
return selectedState;
}
    // Attach store methods to the hook for direct access
    (useStore as any).getState = getState;
(useStore as any).setState = setState;
(useStore as any).mutate = mutate;
(useStore as any).subscribe = subscribe;
(useStore as any).destroy = destroy;

    return useStore as UseStore<T>;
}

// ── Hook Type ──

export interface UseStore<T> {
    (): T;
    <U>(selector: Selector<T, U>): U;
    getState: GetState<T>;
    setState: SetState<T>;
    mutate(recipe: (draft: T) => void): void;
    subscribe(listener: Listener<T>): () => void;
    destroy(): void;
}


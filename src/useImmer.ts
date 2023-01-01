import produce, { Draft, nothing, freeze } from "immer";
import React, { useState, useReducer, useCallback, useMemo, Dispatch, DependencyList } from "react";

export type Reducer<S = any, A = any> = (
    draftState: Draft<S>,
    action: A
) => void | (S extends undefined ? typeof nothing : S);
export type DraftFunction<S> = (draft: Draft<S>) => void;
export type Updater<S> = (arg: S | DraftFunction<S>) => void;
export type ImmerHook<S> = [S, Updater<S>];
export function useImmer<S = any>(initialValue: S | (() => S), deps?: DependencyList | undefined): ImmerHook<S>;

export function useImmer(initialValue: any, deps: DependencyList | undefined = []) {
    const [val, updateValue] = useState<any>(null);

    React.useEffect(() => {
        updateValue(() =>
            freeze(
                typeof initialValue === "function" ? initialValue() : initialValue,
                true
            ))
    }, deps)

    return [
        val,
        useCallback((updater: any) => {
            if (typeof updater === "function") updateValue(produce(updater));
            else updateValue(freeze(updater));
        }, [updateValue]),
    ];
}

export function useImmerReducer<S = any, A = any>(
    reducer: Reducer<S, A>,
    initialState: S,
    initialAction?: (initial: any) => S
): [S, Dispatch<A>];
export function useImmerReducer(
    reducer: any,
    initialState: any,
    initialAction: any
) {
    const cachedReducer = useMemo(() => produce(reducer), [reducer]);
    return useReducer(cachedReducer, initialState as any, initialAction);
}
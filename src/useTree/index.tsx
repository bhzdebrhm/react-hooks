import React from 'react';
import {
    materializeNode,
    getEvent,
    findTargetPathById,
    addNode,
    findTargetNode,
    deleteNode,
    updateNodeProps,
    readNodeProps,
    findAllTargetPathById,
    setCursorImp,
    getPathNodes,
    setCursorToParent,
    getNodeProps,
    getNode,
    hasChildren,
    replaceChildNodes,
    walkTree,
    formattedNodePaths
} from './utils';
import { testData } from './testData';

interface useTreeProps {
    rootNode: any;
    onChange?: any;
    customReducers?: any;
    options?: any;
}



export const useTree = (props: useTreeProps) => {
    const {
        rootNode,
        onChange,
        customReducers = {},
        //  options = {}
    } = props;

    const [state, setState] = React.useState<any>();
    const [cursor, setCursor] = React.useState<any>();
    const [event, setEvent] = React.useState({
        type: 'initialization',
        path: null,
        params: [],
    });


    // materialize Tree, or componentize it
    React.useEffect(() => {
        const materializedData = materializeNode(rootNode);
        setState(materializedData);
        setCursor(materializedData);
    }, [rootNode]);

    // trigger onChange everytime tree changes or an event occurs
    React.useEffect(() => {
        if (typeof onChange === 'function' && state && event) {
            onChange(state, event);
        }
    }, [state, event, onChange]);

    React.useEffect(() => {
        // update cursor state on tree change
        if (cursor?.id) {
            const cursorNodeId = cursor.id;
            const path = findTargetPathById(state, cursorNodeId);
            const targetNode = findTargetNode(state, path);
            setCursor({ ...targetNode })
        }
    }, [state, cursor?.id])

    // update tree entirely
    const _setTree = (state: any) => {
        const e = getEvent('setTree', null, state);

        setEvent(e);
        setState(state);
    };

    // decorate a reducer function, with additional prop: tree,
    // and with ability to dispatch events by reducer name
    // and setting new state tree
    // find target node by path to node
    const decorateReducerByPath = React.useCallback((reducer: any, name: any) => (path: any, ...args: any) => {
        const _path = path ? [...path] : null;
        const { rootNode, operatedNode, newNode } = reducer(state, _path, ...args);
        const e = getEvent(name, _path, rootNode);

        setEvent(e);
        setState(rootNode);

        return { operatedNode, newNode };
    }, [state]);


    const decorateReducerById = React.useCallback((reducer: any) => (id: any, ...args: any) => {
        const path = findTargetPathById(state, id);
        return path ? reducer(path, ...args) : null;
    }, [state])

    const decorateSetCursorByPath = React.useCallback((cursorGetter: any, name: any) => (path: any) => {
        const _path = path ? [...path] : null;
        const cursor = cursorGetter(state, _path);

        const e = getEvent(name, _path, cursor);
        setEvent(e);
        setCursor(cursor);
    }, [state])


    const decorateSetsetCursorById = React.useCallback((reducer: any) => (id: any) => {
        const path = findTargetPathById(state, id);
        path && reducer(path);
    }, [state])

    const decorateSelectorByPath = React.useCallback((
        selector: any,
        //@ts-ignore
        // name: any
    ) => (path: any, ...args: any) => {
        const _path = path ? [...path] : null;
        const result = state && selector(state, _path, ...args);

        return result;
    }, [state]
    )

    const decorateSelectorById = React.useCallback((selector: any) => (id: any) => {
        const path = findTargetPathById(state, id);
        return path ? selector(path) : null;
    }, [state])


    const _customReducers = React.useMemo(() => {
        return Object.fromEntries(
            Object.entries(customReducers).map(
                ([name, f]) => ([name, decorateReducerByPath(f, name)])
            )
        )
    }, [decorateReducerByPath, customReducers])


    const reducers = React.useMemo(() => {
        const intialReducers = {
            setTree: _setTree,
            addNode: decorateReducerByPath(addNode, 'addNode'),
            replaceChildNodes: decorateReducerByPath(replaceChildNodes, 'replaceChildNodes'),
            deleteNode: decorateReducerByPath(deleteNode, 'deleteNode'),
            updateNodeProps: decorateReducerByPath(updateNodeProps, 'updateNodeProps'),
            readNodeProps: decorateReducerByPath(readNodeProps, 'readNodeProps'),
            ..._customReducers
        };
        return {
            ...intialReducers,
            addNodeById: decorateReducerById(intialReducers.addNode),
            replaceChildNodesById: decorateReducerById(intialReducers.replaceChildNodes),
            deleteNodeById: decorateReducerById(intialReducers.deleteNode),
            updateNodePropsById: decorateReducerById(intialReducers.updateNodeProps),
            readNodePropsById: decorateReducerById(intialReducers.readNodeProps),
        }
    }, [decorateReducerByPath, decorateReducerById])


    const selectors = React.useMemo(() => {
        const initialSelectors = {
            hasChildren: decorateSelectorByPath(hasChildren
                // , 'hasChildren'
            ),
            getPathNodes: decorateSelectorByPath(getPathNodes
                // , 'getPathNodes'
            ),
            getNodeProps: decorateSelectorByPath(getNodeProps
                // , 'getNodeProps'
            ),
            getNode: decorateSelectorByPath(getNode
                // , 'getNode'
            ),
            walkTree: decorateSelectorByPath(walkTree
                // , 'walkTree'
            ),
        };
        return {
            ...initialSelectors,
            getPathNodesById: decorateSelectorById(initialSelectors.getPathNodes),
            getNodePropsById: decorateSelectorById(initialSelectors.getNodeProps),
            getNodeById: decorateSelectorById(initialSelectors.getNode),
            hasChildrenById: decorateSelectorById(initialSelectors.hasChildren),
        }
    }, [decorateSelectorById, decorateSelectorByPath])



    const actions = React.useMemo(() => {
        const initialActions = {
            setCursorImp: decorateSetCursorByPath(setCursorImp, 'setCursor'),
            setCursorToParent: decorateSetCursorByPath(setCursorToParent, 'setCursorToParent'),
        };
        return {
            ...initialActions,
            setCursorById: decorateSetsetCursorById(initialActions.setCursorImp),
            setCursorToParentById: decorateSetsetCursorById(initialActions.setCursorToParent),

        }
    }, [decorateSetsetCursorById, decorateSetCursorByPath])


    return { state, cursor, event, reducers, actions, selectors }

}

export default useTree;
export {
    testData,
    findTargetNode,
    findAllTargetPathById,
    findTargetPathById,
    formattedNodePaths
}
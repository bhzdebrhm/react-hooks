
import { v4 } from 'uuid';
export const deepClone = (x: any) => JSON.parse(JSON.stringify(x));


// deepclone the initial data for internal use, and assign uniq ids to each node
// deepclone only happens once at initialization, other operations will be in-place
export const initTreeWithUniqIds = (rootNode: any) => {
    let curId = 0;
    const _addId = (node: any) => {
        node._id = curId;  // eslint-disable-line
        curId += 1;

        const { children } = node;
        if (children) {
            for (const child of children) {
                _addId(child);
            }
        }

        return node;
    };

    return _addId(deepClone(rootNode));
};



export const getEvent = (eventName: any, path: any, ...params: any) => ({
    type: eventName,
    path,
    params,
});


function Node(this: any, props: any) {
    this.id = v4();
    this.props = props;
    this.children = [];
};


const addChildToNodeInternal = (node: any, child: any) => {
    child.parentId = node.id;
    node.children.push(child);
    return child;
}


export const materializeNode = (data: any) => {
    // const indexedState = initTreeWithUniqIds(data);
    let node;

    node = new (Node as any)(data);
    const { children } = data;
    if (children) {
        for (const child of children) {
            addChildToNodeInternal(node, materializeNode(child))
        }
    }
    return node;
}


export const findAllTargetPathById = (root: any, id: any) => {
    const res: any = [];

    const _traverse = (node: any, currPath: any) => {
        if (node?.id === id) {
            res.push(deepClone(currPath))
        };

        const { children } = node;
        children && children.forEach((n: any, i: number) => _traverse(n, [...currPath, i]))
    }

    _traverse(root, []);

    return res;
}

export const findTargetPathById = (root: any, id: any) => {
    const allPaths = findAllTargetPathById(root, id);
    return allPaths.length > 0
        ? allPaths[0]
        : null
}


export const findTargetNode = (root: any, path: any) => {
    let currNode = root;
    if (path) {
        for (const idx of path) {
            const { children } = currNode;
            if (idx >= children.length || idx < 0) {
                throw new Error('finding node failed: invalid path!!');
            };
            currNode = children[idx]
        };
    }

    return currNode;
}


// crud utilities
export const addNode = (rootNode: any, path: any, node: any) => {

    // find targetNode
    const targetNode = findTargetNode(rootNode, path);
    // return if target node is not found
    if (!Boolean(targetNode)) return


    // materialize new node
    const materializedNode = materializeNode(node);
    // set parent of new node to target node
    materializedNode.parentId = targetNode.id;

    // initialize props children array if not already exist
    if (!(targetNode.props?.children instanceof Array)) {
        targetNode.props.children = [];
    };

    // all set, now add node to target node
    targetNode.props.children.push(materializedNode.props);
    targetNode.children.push(materializedNode);


    return {
        rootNode: { ...rootNode },
        operatedNode: node,
        newNode: materializedNode
    }

};


export const replaceChildNodes = (rootNode: any, path: any, nodes: any) => {
    const materializedNodes: any = []

    // find targetNode
    const targetNode = findTargetNode(rootNode, path);
    // return if target node is not found
    if (!Boolean(targetNode)) return

    // empty childs
    targetNode.props.children = []
    targetNode.children = []

    nodes?.forEach((node: any) => {
        // materialize new node
        const materializedNode = materializeNode(node);
        // set parent of new node to target node
        materializedNode.parentId = targetNode.id;

        // all set, now  replace all child nodes
        targetNode.props.children.push(materializedNode.props);
        targetNode.children.push(materializedNode);
        materializedNodes.push(materializedNode);
    });

    return {
        rootNode: { ...rootNode },
        operatedNode: materializedNodes,
    }
};

export const deleteNode = (rootNode: any, path: any) => {

    if (path.length === 0) {
        // this is root node, return untouched
        return rootNode;
    };

    // index to delete from parent node
    const lastIdx = path.pop();

    // find targetNode
    const targetNode = findTargetNode(rootNode, path);
    // return if target node is not found
    if (!Boolean(targetNode)) return


    // deleted node
    const deletedNode = targetNode.props.children[lastIdx];

    targetNode.children.splice(lastIdx, 1) // remove from node
    targetNode.props.children.splice(lastIdx, 1) // remove from props

    return {
        rootNode: { ...rootNode },
        operatedNode: deletedNode,
    }

};

export const updateNodeProps = (rootNode: any, path: any, updater: (node: any) => any) => {
    // find targetNode
    const targetNode = findTargetNode(rootNode, path);

    // return if target node is not found
    if (!Boolean(targetNode)) return;

    const updatedTargetNodeProps = updater(targetNode.props);
    targetNode.props = { ...updatedTargetNodeProps };

    return {
        rootNode: { ...rootNode },
        operatedNode: updatedTargetNodeProps
    }
};

export const readNodeProps = (rootNode: any, path: any) => {

    // find targetNode
    const targetNode = findTargetNode(rootNode, path);
    // return if target node is not found
    if (!Boolean(targetNode)) return;

    const targetNodeProps = targetNode.props;

    return {
        rootNode: rootNode,
        operatedNode: targetNodeProps
    }
}


// action utilities

export const setCursorImp = (rootNode: any, path: any) => {

    // find targetNode
    const targetNode = findTargetNode(rootNode, path);
    // return if target node is not found
    if (!Boolean(targetNode)) return;

    return targetNode;
};


export const setCursorToParent = (rootNode: any, path: any) => {

    // find targetNode
    const targetNode = findTargetNode(rootNode, path);
    // return if target node is not found
    if (!Boolean(targetNode)) return;

    const parentId = targetNode.parentId || targetNode.id;
    const parentPath = findTargetPathById(rootNode, parentId);
    const parentNode = findTargetNode(rootNode, parentPath);

    return parentNode
};


// selectors utilities
export const getPathNodes = (rootNode: any, path: any) => {
    let currNode = rootNode;
    const nodes = [rootNode];

    for (const idx of path) {
        const { children } = currNode;
        if (idx >= children.length || idx < 0) {
            throw new Error('finding node failed: invalid path!!');
        };
        currNode = children[idx];
        nodes.push(children[idx])
    };

    return nodes;
}

export const getNodeProps = (rootNode: any, path: any) => {

    // find targetNode
    const targetNode = findTargetNode(rootNode, path);
    // return if target node is not found
    if (!Boolean(targetNode)) return;


    return targetNode.props
};

export const getNode = (rootNode: any, path: any) => {
    // find targetNode
    const targetNode = findTargetNode(rootNode, path);
    // return if target node is not found
    if (!Boolean(targetNode)) return;
    return targetNode
};

//@ts-ignore
export const walkTree = (rootNode: any, path: any = [], callback: any): boolean => {
    let keepWalking;
    keepWalking = callback(rootNode);

    for (const child of rootNode.children) {
        if (keepWalking === false) {
            return false;
        };
        keepWalking = walkTree(child, [], callback)
    };
    return keepWalking;
}

export const hasChildren = (rootNode: any, path: any) => {
    // find targetNode
    const targetNode = findTargetNode(rootNode, path);
    // return if target node is not found
    if (!Boolean(targetNode)) return;

    return targetNode?.children.length > 0;
};


export const formattedNodePaths = (nodes: any) => {
    const nodesPathNames = nodes.map((node: any) => {
        return node?.props?.name
    });
    const withOutdefaultDirectory = nodesPathNames.filter((path: string) => path !== 'directory');
    const joinedWithDash = withOutdefaultDirectory.join('/')
    return joinedWithDash;
}
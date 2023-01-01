import React, { DependencyList } from 'react';


export function useLeadingEffect<T>(factory: () => T | null, deps: DependencyList | undefined) {
    const didMount = React.useRef(false);

    React.useEffect(() => {
        if (didMount.current) factory();
        else didMount.current = true;
    }, deps);
}

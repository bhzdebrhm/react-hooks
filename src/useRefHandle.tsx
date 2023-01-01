import { useCallback, useEffect, useMemo, useRef } from 'react';

interface Props {
    onTriggered?: (eventType: Event["type"], e: MouseEvent | TouchEvent | KeyboardEvent) => void;
    onMissTrigger?: (eventType: Event["type"], e: MouseEvent | TouchEvent | KeyboardEvent) => void;
    disableClick?: boolean;
    disableTouch?: boolean;
    disableKeys?: boolean;
    allowAnyKey?: boolean;
    triggerKeys?: string[];
    includeRefs?: Array<React.MutableRefObject<any>>
    includeChildRefs?: boolean;
}

type EventConfigItem = [boolean | undefined, string, (e: Event) => void];

/**
 * Hook used to detect clicks outside a component (or an escape key press). onTriggered function is triggered on `click`, `touch` or escape `keyup` event.
 *
 */
export function useRefHandle({
    onTriggered,
    onMissTrigger,
    disableClick,
    disableTouch,
    disableKeys,
    allowAnyKey,
    includeRefs,
    triggerKeys,
    includeChildRefs,
}: Props) {
    const ref = useRef(null);

    const keyListener = useCallback(
        (e: KeyboardEvent) => {
            if (allowAnyKey) {
                onTriggered && onTriggered(e.type, e);
            } else if (triggerKeys) {
                if (triggerKeys.includes(e.key)) {
                    onTriggered && onTriggered(e.type, e);
                }
            } else {
                if (e.key === 'Escape') {
                    onTriggered && onTriggered(e.type, e);
                }
            }
        },
        [allowAnyKey, triggerKeys, onTriggered]
    );

    //@ts-ignore
    const refComparator = useCallback((ref, target) => {
        console.log("includeRefs", includeRefs)
        if (includeChildRefs) {
            return ref.contains(target) || includeRefs?.some((includedRef) => includedRef.current.contains(target))
        }
        return (ref === target) || (includeRefs?.some((includedRef) => includedRef.current.contains(target)))
    }, [includeChildRefs, includeRefs])


    const clickOrTouchListener = useCallback(
        (e: MouseEvent | TouchEvent) => {
            if (ref && ref.current) {
                if (refComparator(ref.current, e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                    onTriggered?.(e.type, e);
                } else {
                    onMissTrigger?.(e.type, e)
                }
            }
        },
        [onTriggered, onMissTrigger, refComparator]
    );

    // @ts-ignore
    const eventsConfig: EventConfigItem[] = useMemo(
        () => [
            //* hover
            [disableTouch, 'auxclick', clickOrTouchListener],
            [disableTouch, 'mouseout', clickOrTouchListener],
            [disableTouch, 'mouseover', clickOrTouchListener],
            [disableTouch, 'mouseleave', clickOrTouchListener],
            [disableTouch, 'mousedown', clickOrTouchListener],
            [disableTouch, 'mouseup', clickOrTouchListener],
            [disableClick, 'dblclick', clickOrTouchListener],
            [disableClick, 'contextmenu', clickOrTouchListener],
            [disableClick, 'click', clickOrTouchListener],
            [disableTouch, 'touchstart', clickOrTouchListener],
            [disableKeys, 'keyup', keyListener],
        ],
        [disableClick, disableTouch, disableKeys, clickOrTouchListener, keyListener]
    );

    useEffect(() => {
        eventsConfig.map((eventConfigItem) => {
            const [isDisabled, eventName, listener] = eventConfigItem;

            if (!isDisabled) {
                document.addEventListener(eventName, listener);
            }
        });

        return () => {
            eventsConfig.map((eventConfigItem) => {
                const [isDisabled, eventName, listener] = eventConfigItem;

                if (!isDisabled) {
                    document.removeEventListener(eventName, listener);
                }
            });
        };
    }, [eventsConfig]);

    return ref;
}
import { useEffect, useRef, useReducer } from 'react';
import { duration, format, getStartDateOf } from './time';


const ACTION = {
    CHANGE_STATUS: 'CHANGE_STATUS',
    BLUR: 'BLUR',
    FOCUS: 'FOCUS',
    RESET: 'RESET',
}

export const STATUS = {
    STOPPED: 'stopped',
    PAUSED: 'paused',
    RUNNING: 'running',
    RESUMED: 'resumed',
};

const EVERY_SECOND = 1000;
const DEFAULT_FORMAT = '{hours}:{minutes}:{seconds}';

const reducer = (state, action) => {
    const statusTransition = {
        // transition from
        [STATUS.STOPPED]: {

            // transition to
            [STATUS.RUNNING]: () => {
                return {
                    ...state,
                    status: STATUS.RUNNING,
                    createdAt: action.createdAt,
                    start: action.start,
                    end: action.end,
                }
            }
        },

        [STATUS.RUNNING]: {
            [STATUS.STOPPED]: () => {
                return {...state, status: STATUS.STOPPED, start: action.start, end: action.end}
            },

            [STATUS.PAUSED]: () => {
                return {...state, status: STATUS.PAUSED, end: action.end}
            },
        },

        [STATUS.PAUSED]: {
            [STATUS.STOPPED]: () => {
                return {...state, status: STATUS.STOPPED, start: action.start, end: action.end}
            },

            [STATUS.RESUMED]: () => {
                return {...state, status: STATUS.RUNNING, start: action.start, end: action.end}
            },

            [STATUS.RUNNING]: () => {
                return {...state, status: STATUS.RUNNING, start: action.start, end: action.end}
            },
        }
    }

    switch (action.type) {
        case ACTION.CHANGE_STATUS: {
            const fromStatus = state.status;
            const toStatus = action.status;
            const nextState = statusTransition[fromStatus]?.[toStatus]?.(action) || {};

            return {...state, ...nextState};
        }

        case ACTION.BLUR: {
            // on blur, if previous status was RUNNING, keep it.
            const status = state.previousStatus === STATUS.RUNNING ? STATUS.RUNNING : state.status;
            const end = status === STATUS.RUNNING ? null : action.now;

            return {
                ...state,
                isBlurred: true,
                isFocused: false,
                previousStatus: state.status,
                start: action.start,
                end,
                status
            };
        }

        case ACTION.FOCUS: {
            return {
                ...state,
                isFocused: true,
                isBlurred: false,
                previousStatus: state.status,
                status: state.status === STATUS.RUNNING ? STATUS.PAUSED : state.status,
            };
        }

        case ACTION.RESET: {
            return {...state, status: STATUS.STOPPED, start: null, end: null}
        }

        default:
            return state;
    }
}

export const useDuration = (
    initialState = {},
    options = {},
) => {
    const inputRef = useRef(null);
    const previousInputValueRef = useRef(null);
    const intervalRef = useRef(0);

    const updateView = () => {
        const output = format(duration(state.start, state.end), options.format || DEFAULT_FORMAT);
        if (options.writeValue) {
            options.writeValue(output);
        } else {
            inputRef.current.value = output;
        }
    }

    const startInterval = () => {
        if (intervalRef.current !== 0) {
            return;
        }

        updateView();
        intervalRef.current = setInterval(updateView, options.updateInterval || EVERY_SECOND);
    }

    const stopInterval = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = 0;
    }

    const finalInitialState = {
        createdAt: null,
        start: null,
        end: null,
        status: STATUS.STOPPED,
        isFocused: false,
        isBlurred: false,
        previousStatus: STATUS.STOPPED,
        ...initialState
    };

    const [state, dispatch] = useReducer(reducer, finalInitialState);

    useEffect(() => {
        updateView();

        return () => {
            stopInterval();
        }
    }, []);

    useEffect(() => {
        switch (state.status) {
            case STATUS.RUNNING: {
                startInterval();
                break;
            }

            case STATUS.STOPPED:
            case STATUS.PAUSED: {
                stopInterval();
                updateView();
                break;
            }
        }
    }, [state.status]);

    useEffect(() => {
        updateView();
    }, [state.start])

    const isInputValueChanged = () => {
        return previousInputValueRef.current.trim() !== readInputValue().trim();
    }

    const readInputValue = () => {
        return options.readValue ? options.readValue() : inputRef.current.value;
    }

    const start = () => {
        const now = new Date();
        dispatch({type: ACTION.CHANGE_STATUS, status: STATUS.RUNNING, createdAt: now, start: now, end: null});
    }

    const stop = () => {
        dispatch({type: ACTION.CHANGE_STATUS, status: STATUS.STOPPED, start: null, end: null});
    }

    const pause = () => {
        dispatch({type: ACTION.CHANGE_STATUS, status: STATUS.PAUSED, end: new Date()});
    }

    const resume = () => {
        let start = getStartDateOf(readInputValue());
        dispatch({type: ACTION.CHANGE_STATUS, status: STATUS.RUNNING, start, end: null});
    }

    const focus = () => {
        // preserve current input value to compare it later when input is blurred
        previousInputValueRef.current = readInputValue();
        dispatch({type: ACTION.FOCUS});
    }

    const blur = () => {
        let start = state.start;

        // update start date only if input value was changed
        if (isInputValueChanged()) {
            start = getStartDateOf(readInputValue());
        }

        dispatch({type: ACTION.BLUR, start, now: new Date()});
    }

    return {
        inputRef,
        startedAt: state.start,
        endedAt: state.end,
        status: state.status,
        focus,
        blur,
        start,
        stop,
        pause,
        resume,
    }
}

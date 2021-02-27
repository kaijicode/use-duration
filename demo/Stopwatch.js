import React, { useState, useRef, useEffect } from 'react';
import PropTypes from "prop-types";

import style from './style.css';
import { useDuration, STATUS } from "../src/useDuration";
import iconPlay from "./assets/play.svg";
import iconPause from "./assets/pause.svg";
import iconStop from "./assets/stop.svg";
import faviconRunning from './assets/favicon-running.svg';
import faviconPaused from './assets/favicon-paused.svg';
import faviconStopped from './assets/favicon-stopped.svg';


const KEY_SPACEBAR = ' ';

const FAVICON_MAP = {
    [STATUS.RUNNING]: faviconRunning,
    [STATUS.STOPPED]: faviconStopped,
    [STATUS.PAUSED]: faviconPaused
}


const STORAGE_KEY_START = 'stopwatch:start';
const STORAGE_KEY_STATUS = 'stopwatch:status';
const STORAGE_KEY_END = 'stopwatch:end';
const STORAGE_KEY_FORMAT = 'stopwatch:format';
const STORAGE_KEY_COLOR = 'stopwatch:color';
const STORAGE_KEY_BACKGROUND_IMAGE = 'stopwatch:background-image';

const save = (items) => {
    for (const [key, value] of Object.entries(items)) {
        switch(key) {
            case STORAGE_KEY_START:
            case STORAGE_KEY_END:{
                localStorage.setItem(key, value instanceof Date ? value.toISOString() : value);
                break;
            }

            default:
                localStorage.setItem(key, value);
        }
    }
}

const restoreDate = (key) => {
    let value = localStorage.getItem(key);
    return [null, 'null', 'undefined'].includes(value) ? null : new Date(value);
}

const restore = () => {
    return {
        start: restoreDate(STORAGE_KEY_START),
        end: restoreDate(STORAGE_KEY_END),
        status: localStorage.getItem(STORAGE_KEY_STATUS) || STATUS.STOPPED,
        format: localStorage.getItem(STORAGE_KEY_FORMAT) || '{hours}:{minutes}:{seconds}',
        color: localStorage.getItem(STORAGE_KEY_COLOR),
        backgroundImage: localStorage.getItem(STORAGE_KEY_BACKGROUND_IMAGE) || 'linear-gradient(to top, #209cff 0%, #68e0cf 100%)'
    }
}

export const Controls = (props) => {
    const HOT_KEYS = {
        [KEY_SPACEBAR]: {
            [STATUS.RUNNING]: props.onPause,
            [STATUS.PAUSED]: props.onResume,
            [STATUS.STOPPED]: props.onResume
        }
    }

    const handleKeyPress = (event) => {
        HOT_KEYS[event.key]?.[props.status]?.();
    }

    useEffect(() => {
        document.addEventListener('keyup', handleKeyPress);

        return () => {
            document.removeEventListener('keyup', handleKeyPress);
        }
    }, [props.status]);

    const stopButton = (
        <img tabIndex={0} className={'icon'} src={iconStop} alt={'stop'} onClick={props.onStop}/>
    )

    const pauseButton = (
        <img tabIndex={0} className={'icon'} src={iconPause} alt={'pause'} onClick={props.onPause}/>
    )

    const resumeButton = (
        <img tabIndex={0} className={'icon'} src={iconPlay} alt={'resume'} onClick={props.onResume}/>
    )

    const renderControls = () => {
        return props.status === STATUS.RUNNING ?
            <>{pauseButton} {stopButton}</> :
            <>{resumeButton} {stopButton}</>;
    }

    return (
        <div className={'controls'}>
            {renderControls()}
        </div>
    )
}

Controls.propTypes = {
    onStart: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    onPause: PropTypes.func.isRequired,
    onResume: PropTypes.func.isRequired,
    status: PropTypes.oneOf([STATUS.RUNNING, STATUS.STOPPED, STATUS.PAUSED])
}


export const Stopwatch = (props) => {
    const [value, setValue] = useState('');
    const stopwatchRef = useRef();

    const readValue = () => {
        return stopwatchRef.current.innerText.trim();
    }

    const writeValue = (value) => {
        setValue(value);

        // update window title
        document.title = `${value}`;
    }

    const renderValue = (value) => {
        return value.split('').map((digit, index) => {
            const className = ['0', '1', '2', '3', '4', '5', '6' ,'7', '8', '9'].includes(digit) ?
                'time-unit digit' :
                'time-unit';
            return <span key={index} className={className}>{digit}</span>
        })
    }

    const {
        focus,
        blur,
        stop,
        pause,
        resume,
        status,
        startedAt,
        endedAt
    } = useDuration(
        {start: props.start, end: props.end, status: props.status},
        {format: props.format, readValue, writeValue, updateInterval: props.updateInterval}
    );

    useEffect(() => {
        props.onStateChange({ status, startedAt, endedAt, format: props.format });
    }, [status, startedAt, endedAt]);

    // update favicon on status change
    useEffect(() => {
        if (FAVICON_MAP[status]) {
            const link = document.querySelector("link[rel~='icon']");
            link.href = FAVICON_MAP[status];
        }
    }, [status]);

    return (
        <>
            <div ref={stopwatchRef}
                 contentEditable={!props.isReadOnly}
                 className={'stopwatch'}
                 onFocus={focus}
                 onBlur={blur}
                 suppressContentEditableWarning={true}>
                {renderValue(value)}
            </div>

            <Controls onStart={resume}
                      onStop={stop}
                      onPause={pause}
                      onResume={resume}
                      status={status}/>
      </>

    )
}


Stopwatch.propTypes = {
    isReadOnly: PropTypes.bool,
    format: PropTypes.string,
    start: PropTypes.objectOf(Date),
    status: PropTypes.oneOf([STATUS.RUNNING, STATUS.STOPPED, STATUS.PAUSED]),
    updateInterval: PropTypes.number,
    onStateChange: PropTypes.func,
}

Stopwatch.defaultProps = {
    isReadOnly: false,
    format: '{hours}:{minutes}:{seconds}',
    start: null,
    status: STATUS.STOPPED,
    updateInterval: 1000,
    onStateChange: () => {}
}

export const App = () => {
    const state = restore();

    const handleStateChange = ({ status, startedAt, endedAt, format }) => {
        save({
            [STORAGE_KEY_START]: startedAt,
            [STORAGE_KEY_END]: endedAt,
            [STORAGE_KEY_STATUS]: status,
            [STORAGE_KEY_FORMAT]: format,
            [STORAGE_KEY_BACKGROUND_IMAGE]: state.backgroundImage
        });
    }

    return (
        <div className={'page'} style={{ backgroundImage: state.backgroundImage, color: state.color }}>
            <Stopwatch
                start={state.start}
                end={state.end}
                status={state.status}
                format={state.format}
                onStateChange={handleStateChange}
            />
        </div>
    )
}

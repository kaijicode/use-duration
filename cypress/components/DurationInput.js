import React from 'react';
import PropTypes from 'prop-types';

import { STATUS, useDuration } from '../../src/useDuration';
import { Controls } from './Controls';


export const DurationInput = (props) => {
    const {
        inputRef,
        focus,
        blur,
        start,
        stop,
        pause,
        resume,
    } = useDuration({start: props.start, status: props.status}, {
        format: props.format,
        updateInterval: props.updateInterval
    });

    return (
        <>
            <input type="text"
                   ref={inputRef}
                   onFocus={focus}
                   onBlur={blur}
                   data-test-id={'duration'}
            />

            <Controls onStart={start} onStop={stop} onPause={pause} onResume={resume}/>
        </>
    )
}

DurationInput.propTypes = {
    // Format example:
    // {hours}:{minutes}:{seconds}.{milliseconds}
    // {hours}:{minutes}:{seconds}'
    format: PropTypes.string,
    start: PropTypes.objectOf(Date),
    status: PropTypes.oneOf([STATUS.RUNNING, STATUS.STOPPED, STATUS.PAUSED]),
    updateInterval: PropTypes.number
}

DurationInput.defaultProps = {
    format: '{hours}:{minutes}:{seconds}',
    start: null,
    status: STATUS.STOPPED,
    updateInterval: 1000
}
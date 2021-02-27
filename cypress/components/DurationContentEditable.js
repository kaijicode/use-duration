import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { STATUS, useDuration } from "../../src/useDuration";
import { Controls } from './Controls';


export const DurationContentEditable = (props) => {
    const [value, setValue] = useState('');
    const durationRef = useRef();

    const readValue = () => {
        return durationRef.current.innerText.trim();
    }

    const writeValue = (value) => {
        setValue(value);
    }

    const {
        focus,
        blur,
        start,
        stop,
        pause,
        resume,
    } = useDuration(
        {start: props.start, status: props.status},
        {format: props.format, readValue, writeValue, updateInterval: props.updateInterval}
    );

    const renderValue = (value) => {
        return value.split('').map((digit, index) => {
            return <span key={index} data-test-id={index}>{digit}</span>
        })
    }

    return (
        <>
            <div ref={durationRef}
                 contentEditable={!props.isReadOnly}
                 onFocus={focus}
                 onBlur={blur}
                 suppressContentEditableWarning={true}
                 data-test-id={'duration'}>
                {renderValue(value)}
            </div>

            <Controls onStart={start}
                      onStop={stop}
                      onPause={pause}
                      onResume={resume}/>
        </>
    )
}


DurationContentEditable.propTypes = {
    isReadOnly: PropTypes.bool,
    format: PropTypes.string,
    start: PropTypes.objectOf(Date),
    status: PropTypes.oneOf([STATUS.RUNNING, STATUS.STOPPED, STATUS.PAUSED]),
    updateInterval: PropTypes.number
}

DurationContentEditable.defaultProps = {
    isReadOnly: false,
    format: '{hours}:{minutes}:{seconds}',
    start: null,
    status: STATUS.STOPPED,
    updateInterval: 1000
}

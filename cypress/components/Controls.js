import React from 'react';
import PropTypes from 'prop-types';

import { STATUS } from '../../src/useDuration';


export const Controls = (props) => {
    return (
        <>
            <button type={'button'} onClick={props.onStart} data-test-id={'btn-start'}>start</button>
            <button type={'button'} onClick={props.onPause} data-test-id={'btn-pause'}>pause</button>
            <button type={'button'} onClick={props.onStop} data-test-id={'btn-stop'}>stop</button>
            <button type={'button'} onClick={props.onResume} data-test-id={'btn-resume'}>resume</button>
        </>
    )
}

Controls.defaultProps = {
    status: PropTypes.oneOf([STATUS.STOPPED, STATUS.PAUSED, STATUS.RUNNING, STATUS.RESUMED])
}

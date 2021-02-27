const ONE_SECOND_IN_MILLISECONDS = 1000;
const ONE_MINUTE_IN_MILLISECONDS = ONE_SECOND_IN_MILLISECONDS * 60;
const ONE_HOUR_TO_MILLISECONDS = ONE_MINUTE_IN_MILLISECONDS * 60;
const TIME_UNIT_REGEX = /\d+/g;
const [TIME_HOURS, TIME_MINUTES, TIME_SECONDS, TIME_MILLISECONDS] = ['hours', 'minutes', 'seconds', 'milliseconds'];
const TIME_UNITS = [TIME_HOURS, TIME_MINUTES, TIME_SECONDS, TIME_MILLISECONDS];

const padWithZeros = (value) => `${value}`.padStart(2, '0');

const toUTC = (date) => {
    return Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    )
}

// difference between two dates
const diff = (start, end) => {
    const startInUTC = toUTC(start);
    const endInUTC = end ? toUTC(end) : toUTC(new Date());

    return Math.abs(endInUTC - startInUTC);
}

export const getStartDateOf = (duration, dateNow = Date.now()) => {
    // ASSUMPTION:
    // time units in `duration` ordered from most significant (hours, left) to least significant (milliseconds, right)
    let [hours = 0, minutes = 0, seconds = 0, milliseconds = 0] = Array.from(duration.matchAll(TIME_UNIT_REGEX)).map((match) => {
        let [timeUnit = '0'] = match;
        try {
            return parseInt(timeUnit, 10);
        } catch (error) {
            return 0;
        }
    });

    const durationInMilliseconds = (
        (hours * ONE_HOUR_TO_MILLISECONDS) +
        (minutes * ONE_MINUTE_IN_MILLISECONDS) +
        (seconds * ONE_SECOND_IN_MILLISECONDS) +

        // ASSUMPTION:
        // This depends on how milliseconds are represented.
        // Lets assume that when milliseconds were formatted for output they were are divided by 10 (100ms became 10)
        // so now we have to do the opposite.
        (milliseconds * 10)
    );

    return new Date(dateNow - durationInMilliseconds);
}

export const format = (duration, expectedFormat = '{hours}:{minutes}:{seconds}') => {
    return TIME_UNITS.reduce((str, timeUnit) => {
        let value = timeUnit === TIME_MILLISECONDS ? Math.floor(duration.milliseconds / 10) : duration[timeUnit];
        value = padWithZeros(value);
        return str.replace(`{${timeUnit}}`, value);
    }, expectedFormat);
}

export const duration = (start, end = null, costOfOneDayInHours) => {
    if (!start) {
        return {days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0};
    }

    let elapsed = diff(start, end);
    let days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0;

    // duration can be calculated in days too, only if `costOfOneDayInHours` is specified.
    const SECONDS_IN_DAY = costOfOneDayInHours * ONE_HOUR_TO_MILLISECONDS;
    if (costOfOneDayInHours && elapsed >= SECONDS_IN_DAY) {
        days = Math.floor(elapsed / SECONDS_IN_DAY);
        elapsed = elapsed % SECONDS_IN_DAY;
    }

    if (elapsed >= ONE_HOUR_TO_MILLISECONDS) {
        hours = Math.floor(elapsed / ONE_HOUR_TO_MILLISECONDS);
        elapsed = elapsed % ONE_HOUR_TO_MILLISECONDS;
    }

    if (elapsed >= ONE_MINUTE_IN_MILLISECONDS) {
        minutes = Math.floor(elapsed / ONE_MINUTE_IN_MILLISECONDS);
        elapsed = elapsed % ONE_MINUTE_IN_MILLISECONDS;
    }

    if (elapsed >= ONE_SECOND_IN_MILLISECONDS) {
        seconds = Math.floor(elapsed / ONE_SECOND_IN_MILLISECONDS);
        milliseconds = elapsed % ONE_SECOND_IN_MILLISECONDS;
    } else {
        milliseconds = elapsed;
    }

    return {days, hours, minutes, seconds, milliseconds};
}

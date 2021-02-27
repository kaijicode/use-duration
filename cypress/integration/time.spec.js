import { duration, format, getStartDateOf } from '../../src/time'

describe('time', () => {
    describe('duration', () => {
        it('should calculate difference in hours', () => {
            const date1 = new Date(2020, 1, 1, 1, 0, 0, 0);
            const date2 = new Date(2020, 1, 1, 2, 0, 0, 0);
            const diff = duration(date1, date2);

            expect(diff).to.be.deep.equal({days: 0, hours: 1, minutes: 0, seconds: 0, milliseconds: 0});
        });

        it('should calculate difference in minutes', () => {
            const date1 = new Date(2020, 1, 1, 0, 5, 0, 0);
            const date2 = new Date(2020, 1, 1, 0, 0, 0, 0);
            const diff = duration(date1, date2);

            expect(diff).to.be.deep.equal({days: 0, hours: 0, minutes: 5, seconds: 0, milliseconds: 0});
        });

        it('should calculate difference in seconds', () => {
            const date1 = new Date(2020, 1, 1, 0, 0, 0, 0);
            const date2 = new Date(2020, 1, 1, 0, 0, 5, 0);
            const diff = duration(date1, date2);

            expect(diff).to.be.deep.equal({days: 0, hours: 0, minutes: 0, seconds: 5, milliseconds: 0});
        });


        it('should calculate difference in milliseconds', () => {
            const date1 = new Date(2020, 1, 1, 0, 0, 0, 0);
            const date2 = new Date(2020, 1, 1, 0, 0, 0, 500);
            const diff = duration(date1, date2);

            expect(diff).to.be.deep.equal({days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 500});
        });
    });

    describe('format', () => {
        it('should return formatted duration', () => {
            const duration = {hours: 1, minutes: 2, seconds: 3, milliseconds: 40};
            const expectedFormat = '{hours}:{minutes}:{seconds}.{milliseconds}';
            expect(format(duration, expectedFormat)).to.be.equal('01:02:03.04');
        })
    });

    describe('getStartDateOf', () => {
        it('should return calculate start date for given duration string', () => {
            const now = new Date(2021, 1, 1, 10, 10, 10, 50);
            const startDate = getStartDateOf('01:02:03.04', now);

            // milliseconds are divided by 10 (04 -> 40 / 10)
            const expected = new Date(2021, 1, 1, 9, 8, 7, 10)
            expect(startDate.getTime()).to.be.equal(expected.getTime());
        })
    });
});
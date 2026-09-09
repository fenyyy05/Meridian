const { toZonedTime, fromZonedTime } = require('date-fns-tz');

const now = new Date('2026-09-09T19:30:00.000Z'); // 01:00 AM IST on Sep 10
const TIMEZONE = 'Asia/Kolkata';

const zoned = toZonedTime(now, TIMEZONE);
zoned.setHours(0, 0, 0, 0);
const startOfDayUTC = fromZonedTime(zoned, TIMEZONE);

console.log("Original Date:", now.toISOString());
console.log("Zoned Date:", zoned.toISOString());
console.log("Start of Day IST (in UTC):", startOfDayUTC.toISOString());

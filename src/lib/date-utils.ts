import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz'

export const DEFAULT_TIMEZONE = 'Asia/Kolkata'

/**
 * Returns a UTC Date object that represents 00:00:00 local time
 * in the default timezone for the current day.
 */
export function getLocalStartOfDay(dateInput: Date | string | number) {
  const date = new Date(dateInput)
  const zoned = toZonedTime(date, DEFAULT_TIMEZONE)
  zoned.setHours(0, 0, 0, 0)
  return fromZonedTime(zoned, DEFAULT_TIMEZONE)
}

/**
 * Returns a UTC Date object that represents 00:00:00 local time
 * in the default timezone for the current day.
 */
export function getLocalToday() {
  return getLocalStartOfDay(new Date())
}

/**
 * Formats a date using the default timezone
 */
export function formatLocal(date: Date | string | number, formatStr: string) {
  return formatInTimeZone(date, DEFAULT_TIMEZONE, formatStr)
}

// taskers/lib/age.ts
// 18+ check used by the signup form, the profile form and the server actions.
// Works on calendar dates in Bangladesh time, so someone who turns 18 today can sign up today,
// whatever the server's or the phone's clock zone is.

export const MIN_DOB = '1900-01-01'
const TZ = 'Asia/Dhaka'

/** Today's date in Bangladesh as YYYY-MM-DD. */
export function todayBD(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

/** The latest date of birth that is 18 or older today (YYYY-MM-DD). Also used as the date input's max. */
export function adultCutoff(now: Date = new Date()): string {
  const [y, m, d] = todayBD(now).split('-').map(Number)
  const year = y - 18
  // born on 29 Feb: in a non-leap year they turn 18 on 1 Mar, so 28 Feb is the last allowed day
  const day = m === 2 && d === 29 && !isLeap(year) ? 28 : d
  return `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** A real calendar date in YYYY-MM-DD form. */
export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/** True if the date of birth is real, not before 1900, and 18 or older today. */
export function isAdultDob(value: string, now: Date = new Date()): boolean {
  // YYYY-MM-DD strings compare correctly as text
  return isRealDate(value) && value >= MIN_DOB && value <= adultCutoff(now)
}

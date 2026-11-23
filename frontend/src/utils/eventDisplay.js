const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 })

export function eventFee(paise) {
  return paise > 0 ? currency.format(paise / 100) : 'Free'
}

export function eventDate(value, short = false) {
  if (!value) return 'Date to be announced'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date to be announced'
  const label = date.toLocaleDateString('en-IN', {
    day: '2-digit', month: short ? 'short' : 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
  })
  return short ? label.toUpperCase() : label
}

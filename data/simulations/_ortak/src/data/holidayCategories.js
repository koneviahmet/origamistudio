export const HOLIDAY_CATEGORY_ORDER = [
  'building',
  'nature',
  'festive',
]

export const HOLIDAY_CATEGORY_LABELS = {
  building: 'Kulübe & Zemin',
  nature: 'Ağaç & Kar',
  festive: 'Süs & Hediye',
}

export function getHolidayCategories() {
  return HOLIDAY_CATEGORY_ORDER.map((id) => ({
    id,
    label: HOLIDAY_CATEGORY_LABELS[id] ?? id,
  }))
}

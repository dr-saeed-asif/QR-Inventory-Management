import groceryCatalog from '@/data/grocery-catalog.json'

export type GroceryLocale = 'en' | 'ur'

export type GroceryItem = {
  id: string
  nameEn: string
  nameUr: string
  roman: string
}

export type GroceryCategory = {
  id: string
  nameEn: string
  nameUr: string
  items: GroceryItem[]
}

export type GroceryCatalogFile = {
  ui: Record<GroceryLocale, Record<string, string>>
  categories: GroceryCategory[]
}

export const groceryCatalogData = groceryCatalog as GroceryCatalogFile

export function groceryUiStrings(locale: GroceryLocale): Record<string, string> {
  return groceryCatalogData.ui[locale] ?? groceryCatalogData.ui.en
}

/** Primary line for lists (English or Urdu + roman subtitle in Urdu mode). */
export function groceryItemLabel(item: GroceryItem, locale: GroceryLocale): string {
  if (locale === 'ur') {
    return `${item.nameUr} (${item.roman})`
  }
  return item.nameEn
}

export function groceryCategoryLabel(cat: GroceryCategory, locale: GroceryLocale): string {
  if (locale === 'ur') {
    return `${cat.nameUr} — ${cat.nameEn}`
  }
  return `${cat.nameEn} (${cat.nameUr})`
}

/** Value sent to search filter (English product name for DB / import compatibility). */
export function groceryItemSearchValue(item: GroceryItem): string {
  return item.nameEn
}

/** Category filter string (English; backend matches category name contains). */
export function groceryCategoryFilterValue(cat: GroceryCategory): string {
  return cat.nameEn
}

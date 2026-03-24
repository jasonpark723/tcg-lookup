// TCG Tracking API helpers
// API Documentation: https://tcgtracking.com/tcgapi/

const API_BASE = 'https://tcgtracking.com/tcgapi/v1'

// Category IDs
export const CATEGORY_POKEMON_JP = 85
export const CATEGORY_ONE_PIECE = 68

export interface TCGSet {
  id: number
  name: string
  abbreviation: string
  published_on: string
  product_count: number
}

interface TCGSetsResponse {
  category_id: number
  category_name: string
  sets: TCGSet[]
}

export interface TCGProduct {
  id: number
  name: string
  number: string | null
  rarity: string | null
  image_url: string | null
}

export interface TCGSetResponse {
  set_id: number
  set_name: string
  set_abbr: string
  set_released: string
  product_count: number
  products: TCGProduct[]
}

// Pricing response: prices is an object keyed by product ID
// Each value has tcg.{variant}.market structure
interface TCGPricingResponse {
  set_id: number
  prices: Record<string, {
    tcg?: Record<string, { market?: number }>
  }>
}

// Card type used by components (combines product + pricing)
export interface Card {
  id: number
  name: string
  card_number: string | null
  rarity: string | null
  image_url: string | null
  price: number | null
}

// Fetch all sets for a category
export async function fetchSets(categoryId: number = CATEGORY_POKEMON_JP): Promise<TCGSet[]> {
  const response = await fetch(`${API_BASE}/${categoryId}/sets`)
  if (!response.ok) {
    throw new Error(`Failed to fetch sets: ${response.statusText}`)
  }
  const data: TCGSetsResponse = await response.json()
  return data.sets || []
}

// Fetch all products from a set
export async function fetchSetProducts(setId: number, categoryId: number = CATEGORY_POKEMON_JP): Promise<TCGProduct[]> {
  const response = await fetch(`${API_BASE}/${categoryId}/sets/${setId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch set ${setId}: ${response.statusText}`)
  }
  const data: TCGSetResponse = await response.json()
  return data.products || []
}

// Fetch pricing for a set
export async function fetchSetPricing(setId: number, categoryId: number = CATEGORY_POKEMON_JP): Promise<Map<number, number | null>> {
  const response = await fetch(`${API_BASE}/${categoryId}/sets/${setId}/pricing`)
  if (!response.ok) {
    throw new Error(`Failed to fetch pricing for set ${setId}: ${response.statusText}`)
  }
  const data: TCGPricingResponse = await response.json()
  const priceMap = new Map<number, number | null>()

  // prices is an object keyed by product ID
  for (const [productId, priceData] of Object.entries(data.prices || {})) {
    // Get the first variant's market price
    const variants = priceData.tcg || {}
    const firstVariant = Object.values(variants)[0]
    const marketPrice = firstVariant?.market ?? null
    priceMap.set(Number(productId), marketPrice)
  }

  return priceMap
}

// Fetch cards with pricing for a set
export async function fetchCardsWithPricing(setId: number, categoryId: number = CATEGORY_POKEMON_JP): Promise<Card[]> {
  const [products, priceMap] = await Promise.all([
    fetchSetProducts(setId, categoryId),
    fetchSetPricing(setId, categoryId)
  ])

  // Filter to cards (products with a number) and combine with pricing
  return products
    .filter(p => p.number !== null)
    .map(p => ({
      id: p.id,
      name: p.name,
      card_number: p.number,
      rarity: p.rarity,
      image_url: p.image_url,
      price: priceMap.get(p.id) ?? null
    }))
}

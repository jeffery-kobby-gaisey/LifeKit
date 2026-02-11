export interface Currency {
  code: string
  name: string
  symbol: string
  country: string
}

export const CURRENCIES: Currency[] = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', country: 'Ghana' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', country: 'Tanzania' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', country: 'Uganda' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', country: 'Ethiopia' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', country: 'Egypt' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', country: 'Morocco' },
  { code: 'XOF', name: 'West African Franc', symbol: 'Fr', country: 'West Africa' },
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'USA' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'Europe' },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'UK' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil' }
]

const CURRENCY_KEY = 'life-os-currency'
const DEFAULT_CURRENCY = CURRENCIES[0] // NGN

export function getCurrency(): Currency {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY
  
  const stored = localStorage.getItem(CURRENCY_KEY)
  if (!stored) return DEFAULT_CURRENCY
  
  const currency = CURRENCIES.find((c) => c.code === stored)
  return currency || DEFAULT_CURRENCY
}

export function setCurrency(code: string) {
  if (typeof window === 'undefined') return
  
  const currency = CURRENCIES.find((c) => c.code === code)
  if (currency) {
    localStorage.setItem(CURRENCY_KEY, code)
  }
}

export function formatMoney(amount: number, currency?: Currency): string {
  const curr = currency || getCurrency()
  return `${curr.symbol}${amount.toLocaleString()}`
}

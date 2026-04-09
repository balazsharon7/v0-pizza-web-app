'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { CartItem, Product, Size, Topping } from './types'

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART'; payload?: boolean }
  | { type: 'LOAD_CART'; payload: CartItem[] }

interface CartContextType extends CartState {
  addItem: (product: Product, size: Size | null, toppings: Topping[], quantity: number, notes?: string) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: (open?: boolean) => void
  subtotal: number
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.product.id === action.payload.product.id &&
          item.size?.id === action.payload.size?.id &&
          JSON.stringify(item.toppings.map((t) => t.id).sort()) ===
            JSON.stringify(action.payload.toppings.map((t) => t.id).sort())
      )

      if (existingIndex > -1) {
        const newItems = [...state.items]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity,
          totalPrice:
            newItems[existingIndex].unitPrice *
            (newItems[existingIndex].quantity + action.payload.quantity),
        }
        return { ...state, items: newItems }
      }

      return { ...state, items: [...state.items, action.payload] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((item) => item.id !== action.payload.id) }
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? {
                ...item,
                quantity: action.payload.quantity,
                totalPrice: item.unitPrice * action.payload.quantity,
              }
            : item
        ),
      }
    }
    case 'CLEAR_CART':
      return { ...state, items: [] }
    case 'TOGGLE_CART':
      return { ...state, isOpen: action.payload ?? !state.isOpen }
    case 'LOAD_CART':
      return { ...state, items: action.payload }
    default:
      return state
  }
}

const CART_STORAGE_KEY = 'terra-verde-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false })

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const items = JSON.parse(saved)
        dispatch({ type: 'LOAD_CART', payload: items })
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
    }
  }, [])

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error)
    }
  }, [state.items])

  const addItem = (
    product: Product,
    size: Size | null,
    toppings: Topping[],
    quantity: number,
    notes?: string
  ) => {
    const basePrice = product.base_price
    const sizeMultiplier = size?.price_multiplier ?? 1
    const toppingsPrice = toppings.reduce((sum, t) => sum + t.price, 0)
    const unitPrice = Math.round(basePrice * sizeMultiplier) + toppingsPrice
    const totalPrice = unitPrice * quantity

    const item: CartItem = {
      id: `${product.id}-${size?.id ?? 'default'}-${Date.now()}`,
      product,
      size,
      toppings,
      quantity,
      unitPrice,
      totalPrice,
      notes,
    }

    dispatch({ type: 'ADD_ITEM', payload: item })
  }

  const removeItem = (id: string) => dispatch({ type: 'REMOVE_ITEM', payload: id })
  const updateQuantity = (id: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })
  const toggleCart = (open?: boolean) => dispatch({ type: 'TOGGLE_CART', payload: open })

  const subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0)
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

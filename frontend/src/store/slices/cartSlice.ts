import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/product';
import { SaleItemCreate } from '@/types/sale';

interface CartItem extends SaleItemCreate {
  product_name: string;
  product_sku?: string;
  stock_available: number;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  isLoading: boolean;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyDiscount: (amount: number) => void;
  clearCart: () => void;
  getCartSummary: () => { items: CartItem[]; subtotal: number; discount: number; total: number };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      isLoading: false,
      
      addItem: (product: Product, quantity: number) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(i => i.product_id === product.id);
        
        let newItems;
        if (existingIndex >= 0) {
          newItems = [...currentItems];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            cantidad: newItems[existingIndex].cantidad + quantity,
          };
        } else {
          newItems = [
            ...currentItems,
            {
              product_id: product.id,
              cantidad: quantity,
              precio_unitario: product.precio_venta,
              descuento: 0,
              product_name: product.name,
              product_sku: product.sku,
              stock_available: product.stock_disponible,
            },
          ];
        }
        
        const subtotal = newItems.reduce((sum, i) => sum + (i.cantidad * i.precio_unitario), 0);
        const total = subtotal - get().discount;
        
        set({
          items: newItems,
          subtotal,
          total,
        });
      },
      
      removeItem: (productId: string) => {
        const newItems = get().items.filter(i => i.product_id !== productId);
        const subtotal = newItems.reduce((sum, i) => sum + (i.cantidad * i.precio_unitario), 0);
        const total = subtotal - get().discount;
        
        set({
          items: newItems,
          subtotal,
          total,
        });
      },
      
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        const newItems = get().items.map(i =>
          i.product_id === productId
            ? { ...i, cantidad: quantity }
            : i
        );
        
        const subtotal = newItems.reduce((sum, i) => sum + (i.cantidad * i.precio_unitario), 0);
        const total = subtotal - get().discount;
        
        set({
          items: newItems,
          subtotal,
          total,
        });
      },
      
      applyDiscount: (amount: number) => {
        const subtotal = get().subtotal;
        const discount = Math.min(amount, subtotal);
        set({
          discount,
          total: subtotal - discount,
        });
      },
      
      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
        });
      },
      
      getCartSummary: () => {
        const { items, subtotal, discount, total } = get();
        return { items, subtotal, discount, total };
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
from difflib import get_close_matches
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.product import Product

class ProductMatcher:
    """
    Encuentra productos por nombre usando fuzzy matching.
    """
    
    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id
        self.products_cache = None
        self.names_cache = None
        
    def _load_products(self):
        """Carga todos los productos activos del negocio en memoria."""
        if self.products_cache is None:
            products = self.db.query(Product).filter(
                Product.business_id == self.business_id,
                Product.is_active == True,
                Product.deleted_at.is_(None)
            ).all()
            self.products_cache = {p.id: p for p in products}
            self.names_cache = [p.name.lower() for p in products]
            
    def find_product(self, query: str, threshold: float = 0.6) -> Optional[Product]:
        """
        Busca el producto más cercano al texto ingresado.
        Retorna None si no hay coincidencia suficiente.
        """
        self._load_products()
        query_lower = query.lower().strip()
        
        # Primero intentar coincidencia exacta
        for product in self.products_cache.values():
            if query_lower == product.name.lower():
                return product
            if product.sku and query_lower == product.sku.lower():
                return product
                
        # Luego fuzzy matching
        matches = get_close_matches(query_lower, self.names_cache, n=1, cutoff=threshold)
        if matches:
            matched_name = matches[0]
            # Encontrar el producto correspondiente
            for product in self.products_cache.values():
                if product.name.lower() == matched_name:
                    return product
        return None
        
    def find_multiple_products(self, queries: List[str]) -> List[Tuple[Product, str, float]]:
        """
        Retorna lista de (producto, query_original, score).
        """
        results = []
        for q in queries:
            product = self.find_product(q)
            if product:
                results.append((product, q, 1.0))
            else:
                results.append((None, q, 0.0))
        return results
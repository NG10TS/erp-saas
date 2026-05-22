"""
Gestión de secuenciales de facturación SRI
"""
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime


class SequentialManager:
    """
    Gestiona los secuenciales por establecimiento y punto de emisión.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def obtener_siguiente_secuencial(
        self,
        business_id: UUID,
        establecimiento: str = '001',
        punto_emision: str = '001',
        tipo_comprobante: str = '01'
    ) -> int:
        """
        Obtiene el siguiente número secuencial para facturación.
        
        Args:
            business_id: ID del negocio
            establecimiento: Código de establecimiento (3 dígitos)
            punto_emision: Código de punto de emisión (3 dígitos)
            tipo_comprobante: Tipo de comprobante SRI
        
        Returns:
            Siguiente número secuencial
        """
        from app.models.invoice_sequence import InvoiceSequence
        
        # Buscar secuencial existente
        sequence = self.db.query(InvoiceSequence).filter(
            InvoiceSequence.business_id == business_id,
            InvoiceSequence.establecimiento == establecimiento,
            InvoiceSequence.punto_emision == punto_emision,
            InvoiceSequence.tipo_comprobante == tipo_comprobante,
            InvoiceSequence.is_active == True
        ).with_for_update().first()  # Lock para evitar concurrencia
        
        if sequence:
            # Incrementar
            siguiente = sequence.secuencial_actual + 1
            
            # Validar límite (999,999,999)
            if siguiente > 999999999:
                raise ValueError(
                    f"Secuencial máximo alcanzado para {establecimiento}-{punto_emision}"
                )
            
            sequence.secuencial_actual = siguiente
            sequence.updated_at = datetime.utcnow()
            self.db.commit()
            
            return siguiente
        
        # Crear nuevo secuencial
        new_sequence = InvoiceSequence(
            business_id=business_id,
            establecimiento=establecimiento.zfill(3),
            punto_emision=punto_emision.zfill(3),
            tipo_comprobante=tipo_comprobante,
            secuencial_actual=1,
            secuencial_inicial=1,
            secuencial_final=999999999,
            is_active=True
        )
        
        self.db.add(new_sequence)
        self.db.commit()
        
        return 1
    
    def formatear_secuencial(self, secuencial: int) -> str:
        """Formatea un número secuencial a 9 dígitos"""
        return str(secuencial).zfill(9)
    
    def obtener_numero_comprobante(self, establecimiento: str, punto_emision: str, secuencial: str) -> str:
        """Formatea el número de comprobante: ESTABLECIMIENTO-PUNTO-SECUENCIAL"""
        return f"{establecimiento.zfill(3)}-{punto_emision.zfill(3)}-{secuencial.zfill(9)}"
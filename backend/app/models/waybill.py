"""
Modelo para Guías de Remisión SRI - Simplificado para Delivery
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import BaseModel


class Waybill(BaseModel):
    """
    Guía de Remisión Electrónica SRI - Versión Delivery
    
    Enfocada en microempresas que hacen entrega a domicilio.
    Campos simplificados para facilitar el uso desde WhatsApp.
    """
    
    __tablename__ = "waybills"
    
    # Identificación
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    sale_id = Column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    
    # Secuencial SRI
    sequential = Column(String(20), nullable=False)
    waybill_number = Column(String(49))  # Clave de acceso
    
    # ─── DATOS DE TRASLADO (simplificados) ───
    tipo_guia = Column(String(2), nullable=False, default="02")  # 02 = Traslado por venta
    motivo_traslado = Column(Text, nullable=False, default="Entrega a domicilio")
    direccion_partida = Column(Text)  # Dirección del negocio
    direccion_destino = Column(Text)  # Dirección del cliente
    fecha_inicio = Column(DateTime, default=datetime.utcnow)
    fecha_fin = Column(DateTime)
    
    # ─── DESTINATARIO ───
    destinatario_name = Column(String(300))
    destinatario_identification = Column(String(13), default="9999999999999")
    destinatario_phone = Column(String(20))
    destinatario_address = Column(Text)
    
    # ─── TRANSPORTE (simplificado para delivery) ───
    tipo_transporte = Column(String(2), default="01")  # 01 = Propio (delivery)
    transportista_nombre = Column(String(300))  # Nombre del repartidor
    placa = Column(String(10))  # "MOTO" o "DELIVERY" para entregas simples
    
    # ─── TRACKING (nuevo) ───
    tracking_status = Column(String(20), default="PENDING")
    # PENDING → CONFIRMED → PICKED_UP → IN_TRANSIT → DELIVERED → CANCELLED
    
    # ─── EVIDENCIA DE ENTREGA (nuevo) ───
    photo_url = Column(String(500))  # Foto de entrega
    signature_url = Column(String(500))  # Firma del receptor
    delivery_notes = Column(Text)  # Notas de entrega
    
    # ─── SRI ───
    sri_status = Column(String(20), default="draft")
    sri_error = Column(Text)
    authorization_date = Column(DateTime)
    authorization_number = Column(String(50))
    
    # XML
    xml_content = Column(Text)
    xml_signed = Column(Text)
    pdf_url = Column(String(500))
    
    # Notificación WhatsApp
    whatsapp_sent = Column(Boolean, default=False)
    whatsapp_sent_at = Column(DateTime)
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = relationship("Business")
    sale = relationship("Sale")
    invoice = relationship("Invoice")
    details = relationship("WaybillDetail", back_populates="waybill", cascade="all, delete-orphan")
    tracking_history = relationship("WaybillTracking", back_populates="waybill", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Waybill {self.sequential} - {self.tracking_status}>"


class WaybillDetail(BaseModel):
    """Detalle de Guía de Remisión"""
    
    __tablename__ = "waybill_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    waybill_id = Column(UUID(as_uuid=True), ForeignKey("waybills.id"), nullable=False)
    
    product_sku = Column(String(50))
    product_name = Column(String(255), nullable=False)
    quantity = Column(String(20), nullable=False)
    
    waybill = relationship("Waybill", back_populates="details")


class WaybillTracking(BaseModel):
    """
    Historial de tracking de la guía de remisión
    
    Registra cada cambio de estado para trazabilidad completa.
    """
    
    __tablename__ = "waybill_tracking"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    waybill_id = Column(UUID(as_uuid=True), ForeignKey("waybills.id"), nullable=False)
    
    status = Column(String(20), nullable=False)
    # PENDING, CONFIRMED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED
    
    notes = Column(Text)
    location_lat = Column(String(50))  # Latitud (opcional para GPS)
    location_lng = Column(String(50))  # Longitud (opcional para GPS)
    photo_url = Column(String(500))  # Foto del estado
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    waybill = relationship("Waybill", back_populates="tracking_history")
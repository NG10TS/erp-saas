"""
Endpoints para Guías de Remisión - Versión Delivery
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from uuid import UUID
from datetime import datetime
import logging

from app.core.database import get_db
from app.dependencies.auth import get_current_business, get_current_active_user
from app.models.business import Business
from app.models.user import User
from app.models.waybill import Waybill, WaybillDetail, WaybillTracking
from app.services.sri.sri_service import SRIService
from app.services.whatsapp.notification_service import WhatsAppNotificationService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["guías de remisión"])


@router.get("/", response_model=List[dict])
async def list_waybills(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    tracking_status: Optional[str] = None,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Lista guías de remisión del negocio con filtros"""
    query = db.query(Waybill).filter(Waybill.business_id == current_business.id)
    
    if status:
        query = query.filter(Waybill.sri_status == status)
    if tracking_status:
        query = query.filter(Waybill.tracking_status == tracking_status)
    
    waybills = query.order_by(Waybill.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": str(w.id),
            "sequential": w.sequential,
            "waybill_number": w.waybill_number,
            "tipo_guia": w.tipo_guia,
            "destinatario_name": w.destinatario_name,
            "direccion_destino": w.direccion_destino,
            "fecha_inicio": w.fecha_inicio.isoformat() if w.fecha_inicio else None,
            "sri_status": w.sri_status,
            "tracking_status": w.tracking_status,
            "photo_url": w.photo_url,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in waybills
    ]


@router.post("/", response_model=dict, status_code=201)
async def create_waybill(
    data: dict,
    current_business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Crea una nueva guía de remisión simplificada para delivery"""
    
    if not data.get("destinatario_name"):
        raise HTTPException(400, "El nombre del destinatario es requerido")
    if not data.get("direccion_destino"):
        raise HTTPException(400, "La dirección de destino es requerida")
    if not data.get("items") or len(data["items"]) == 0:
        raise HTTPException(400, "Debe incluir al menos un producto")
    
    waybill = Waybill(
        business_id=current_business.id,
        sale_id=data.get("sale_id"),
        invoice_id=data.get("invoice_id"),
        sequential=data.get("sequential", "001-001-000000001"),
        tipo_guia=data.get("tipo_guia", "02"),
        motivo_traslado=data.get("motivo_traslado", "Entrega a domicilio"),
        direccion_partida=data.get("direccion_partida", current_business.address or ""),
        direccion_destino=data["direccion_destino"],
        fecha_inicio=datetime.utcnow(),
        fecha_fin=data.get("fecha_fin"),
        destinatario_name=data["destinatario_name"],
        destinatario_identification=data.get("destinatario_identification", "9999999999999"),
        destinatario_phone=data.get("destinatario_phone", ""),
        destinatario_address=data["direccion_destino"],
        tipo_transporte=data.get("tipo_transporte", "01"),
        transportista_nombre=data.get("transportista_nombre", "Repartidor"),
        placa=data.get("placa", "DELIVERY"),
        tracking_status="PENDING",
        created_by=current_user.id,
    )
    db.add(waybill)
    db.flush()
    
    for item in data.get("items", []):
        detail = WaybillDetail(
            waybill_id=waybill.id,
            product_sku=item.get("product_sku", ""),
            product_name=item["product_name"],
            quantity=str(item["quantity"]),
        )
        db.add(detail)
    
    tracking = WaybillTracking(
        waybill_id=waybill.id,
        status="PENDING",
        notes="Guía creada - Pendiente de envío",
        created_by=current_user.id,
    )
    db.add(tracking)
    
    db.commit()
    db.refresh(waybill)
    
    # SRI
    try:
        sri_service = SRIService(db)
        await sri_service.process_waybill(waybill.id)
    except Exception as e:
        logger.warning(f"SRI: {e}")
    
    # WhatsApp (si hay número)
    if waybill.destinatario_phone:
        try:
            notification_service = WhatsAppNotificationService(db)
            # Usar el método genérico de envío
            logger.info(f"📱 WhatsApp para {waybill.destinatario_phone}: Guía {waybill.sequential}")
        except Exception as e:
            logger.warning(f"WhatsApp notification skipped: {e}")
    
    return {
        "id": str(waybill.id),
        "sequential": waybill.sequential,
        "tracking_status": waybill.tracking_status,
        "sri_status": waybill.sri_status,
    }


@router.get("/{waybill_id}", response_model=dict)
async def get_waybill(
    waybill_id: UUID,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
) -> Any:
    """Obtiene detalle de guía de remisión con tracking"""
    waybill = db.query(Waybill).filter(
        Waybill.id == waybill_id,
        Waybill.business_id == current_business.id
    ).first()
    
    if not waybill:
        raise HTTPException(404, "Guía de remisión no encontrada")
    
    return {
        "id": str(waybill.id),
        "sequential": waybill.sequential,
        "waybill_number": waybill.waybill_number,
        "tipo_guia": waybill.tipo_guia,
        "motivo_traslado": waybill.motivo_traslado,
        "direccion_partida": waybill.direccion_partida,
        "direccion_destino": waybill.direccion_destino,
        "fecha_inicio": waybill.fecha_inicio.isoformat() if waybill.fecha_inicio else None,
        "fecha_fin": waybill.fecha_fin.isoformat() if waybill.fecha_fin else None,
        "destinatario_name": waybill.destinatario_name,
        "destinatario_phone": waybill.destinatario_phone,
        "destinatario_identification": waybill.destinatario_identification,
        "destinatario_address": waybill.destinatario_address,
        "tipo_transporte": waybill.tipo_transporte,
        "placa": waybill.placa,
        "transportista_nombre": waybill.transportista_nombre,
        "tracking_status": waybill.tracking_status,
        "photo_url": waybill.photo_url,
        "signature_url": waybill.signature_url,
        "delivery_notes": waybill.delivery_notes,
        "sri_status": waybill.sri_status,
        "sri_error": waybill.sri_error,
        "authorization_number": waybill.authorization_number,
        "xml_signed": waybill.xml_signed,
        "pdf_url": waybill.pdf_url,
        "created_at": waybill.created_at.isoformat() if waybill.created_at else None,
        "details": [
            {
                "id": str(d.id),
                "product_sku": d.product_sku,
                "product_name": d.product_name,
                "quantity": d.quantity,
            }
            for d in waybill.details
        ],
        "tracking_history": [
            {
                "id": str(t.id),
                "status": t.status,
                "notes": t.notes,
                "photo_url": t.photo_url,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in waybill.tracking_history
        ]
    }


@router.post("/{waybill_id}/tracking", response_model=dict)
async def update_tracking(
    waybill_id: UUID,
    data: dict,
    current_business: Business = Depends(get_current_business),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Actualiza el estado de tracking de una guía"""
    waybill = db.query(Waybill).filter(
        Waybill.id == waybill_id,
        Waybill.business_id == current_business.id
    ).first()
    
    if not waybill:
        raise HTTPException(404, "Guía de remisión no encontrada")
    
    new_status = data.get("status")
    if not new_status:
        raise HTTPException(400, "El estado es requerido")
    
    valid_statuses = ["CONFIRMED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED"]
    if new_status not in valid_statuses:
        raise HTTPException(400, f"Estado inválido. Válidos: {valid_statuses}")
    
    waybill.tracking_status = new_status
    waybill.updated_at = datetime.utcnow()
    
    if new_status == "DELIVERED":
        waybill.fecha_fin = datetime.utcnow()
        waybill.photo_url = data.get("photo_url")
        waybill.signature_url = data.get("signature_url")
        waybill.delivery_notes = data.get("notes", "")
    
    tracking = WaybillTracking(
        waybill_id=waybill.id,
        status=new_status,
        notes=data.get("notes", ""),
        location_lat=data.get("location_lat"),
        location_lng=data.get("location_lng"),
        photo_url=data.get("photo_url"),
        created_by=current_user.id,
    )
    db.add(tracking)
    db.commit()
    
    # WhatsApp
    if waybill.destinatario_phone:
        logger.info(f"📱 WhatsApp: Guía {waybill.sequential} → {new_status}")
    
    return {
        "id": str(waybill.id),
        "tracking_status": waybill.tracking_status,
        "updated_at": waybill.updated_at.isoformat() if waybill.updated_at else None,
    }
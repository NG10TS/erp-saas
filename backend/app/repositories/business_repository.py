# app/repositories/business_repository.py

from sqlalchemy.orm import Session
from app.models.business import Business


class BusinessRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_name(self, name: str):
        return self.db.query(Business).filter(Business.business_name == name).first()

    def get_by_ruc(self, ruc: str):
        return self.db.query(Business).filter(Business.ruc == ruc).first()

    def get(self, business_id):
        return self.db.query(Business).filter(Business.id == business_id).first()

    def create(self, business: Business):
        self.db.add(business)
        self.db.commit()
        self.db.refresh(business)
        return business
    
    def update(self, business: Business, update_data: dict):
        for field, value in update_data.items():
            setattr(business, field, value)

        self.db.add(business)
        self.db.commit()
        self.db.refresh(business)
        return business
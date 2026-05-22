from app.repositories.sale_repository import SaleRepository
from app.events.sale_created import SaleCreatedEvent


class SalesManager:

    @staticmethod
    def create_sale(db, sale_data):

        sale = SaleRepository.create(db, sale_data)

        # 🔥 disparar evento
        SaleCreatedEvent.handle(db, sale)

        return sale
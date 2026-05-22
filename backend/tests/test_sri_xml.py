"""
SRI XML generation tests
"""
import pytest
from datetime import datetime
from lxml import etree

from app.services.sri.xml_generator import SRIXMLGenerator
from app.models.invoice import Invoice
from app.models.business import Business
from app.models.customer import Customer


def test_generate_invoice_xml():
    """Test invoice XML generation"""
    generator = SRIXMLGenerator()
    
    # Test data
    business = Business(
        ruc="1234567890001",
        business_name="Test Business",
        commercial_name="Test Shop",
        address="Test Address",
        sri_environment="1"
    )
    
    invoice = Invoice(
        invoice_number="1234567890123456789012345678901234567890123456789",
        sequential="001001000000001",
        issue_date=datetime.now(),
        subtotal=100.00,
        iva=15.00,
        total=115.00
    )
    
    customer = Customer(
        name="Test Customer",
        identification="1234567890"
    )
    
    details = [
        {
            "product_name": "Test Product 1",
            "product_sku": "SKU001",
            "quantity": 2,
            "unit_price": 25.00,
            "total_price": 50.00,
            "iva_percentage": 15.0,
            "iva_amount": 7.50
        },
        {
            "product_name": "Test Product 2",
            "product_sku": "SKU002",
            "quantity": 1,
            "unit_price": 50.00,
            "total_price": 50.00,
            "iva_percentage": 15.0,
            "iva_amount": 7.50
        }
    ]
    
    # Generate XML
    xml_str = generator.generate_invoice_xml(
        invoice=invoice,
        business=business,
        customer=customer,
        details=details
    )
    
    # Parse and validate
    root = etree.fromstring(xml_str.encode())
    
    # Check basic structure
    assert root.tag.endswith("factura")
    assert root.get("version") == "1.1.0"
    
    # Check infoTributaria
    info_tributaria = root.find("infoTributaria")
    assert info_tributaria.find("ruc").text == "1234567890001"
    assert info_tributaria.find("claveAcceso").text == invoice.invoice_number
    
    # Check infoFactura
    info_factura = root.find("infoFactura")
    assert info_factura.find("identificacionComprador").text == "1234567890"
    assert info_factura.find("totalSinImpuestos").text == "100.00"
    assert info_factura.find("importeTotal").text == "115.00"
    
    # Check detalles
    detalles = root.find("detalles")
    assert len(detalles.findall("detalle")) == 2


def test_identification_type():
    """Test identification type detection"""
    generator = SRIXMLGenerator()
    
    # Test customer with no ID
    customer1 = Customer()
    assert generator._get_identification_type(customer1) == "07"  # Consumidor Final
    
    # Test with cédula (10 digits)
    customer2 = Customer(identification="1234567890")
    assert generator._get_identification_type(customer2) == "05"  # Cédula
    
    # Test with RUC (13 digits)
    customer3 = Customer(identification="1234567890001")
    assert generator._get_identification_type(customer3) == "04"  # RUC
    
    # Test with other (passport)
    customer4 = Customer(identification="ABC123456")
    assert generator._get_identification_type(customer4) == "06"  # Pasaporte
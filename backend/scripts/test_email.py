# backend/scripts/test_email.py
"""
Script para probar el envío de emails
Ejecutar: python scripts/test_email.py
"""

import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.services.email_service import EmailService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_email_sending():
    """Prueba de envío de email"""
    print("=" * 60)
    print("📧 Testing Email Configuration")
    print("=" * 60)
    
    print(f"\n📋 Configuration:")
    print(f"  SMTP_HOST: {settings.SMTP_HOST}")
    print(f"  SMTP_PORT: {settings.SMTP_PORT}")
    print(f"  SMTP_USER: {settings.SMTP_USER}")
    print(f"  SMTP_FROM: {settings.SMTP_FROM}")
    
    # Email de prueba
    test_email = input("\n📧 Enter test email address (default: nguaman126@gmail.com): ").strip()
    if not test_email:
        test_email = "nguaman126@gmail.com"
        print(f"  Using default: {test_email}")
    
    test_link = "http://localhost:8000/api/v1/auth/verify-email?token=test123456789"
    
    print(f"\n📤 Sending test email to {test_email}...")
    print("⏳ Esto puede tomar unos segundos...\n")
    
    try:
        EmailService.send_verification_email(
            to_email=test_email,
            verification_link=test_link,
            name="Usuario Test"
        )
        print("\n✅ Test email sent successfully!")
        print("📧 Please check your inbox (and spam folder)")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        print("\n💡 Troubleshooting tips:")
        print("  1. Verify SMTP_USER and SMTP_PASSWORD in .env")
        print("  2. For Gmail, use an 'App Password' not your regular password")
        print("  3. Check that 'Less secure app access' is enabled for regular password")
        print("  4. Verify your internet connection")
        print("  5. Check firewall settings")

def test_smtp_connection():
    """Prueba básica de conexión SMTP"""
    import smtplib
    
    print("\n🔌 Testing SMTP connection...")
    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        print("✅ SMTP Login successful!")
        server.quit()
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication failed: {e}")
        print("\n💡 Para Gmail, necesitas:")
        print("  1. Activar verificación en 2 pasos en tu cuenta de Google")
        print("  2. Generar una 'Contraseña de aplicación' en:")
        print("     https://myaccount.google.com/apppasswords")
        print("  3. Usar esa contraseña de 16 dígitos en SMTP_PASSWORD")
        return False
    except Exception as e:
        print(f"❌ SMTP connection failed: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Pruebas de email')
    parser.add_argument('--smtp-only', action='store_true', help='Solo probar conexión SMTP')
    
    args = parser.parse_args()
    
    if args.smtp_only:
        test_smtp_connection()
    else:
        # Primero probar conexión SMTP
        if test_smtp_connection():
            # Si la conexión es exitosa, probar envío
            test_email_sending()
        else:
            print("\n❌ No se pudo establecer conexión SMTP. Revisa tu configuración.")
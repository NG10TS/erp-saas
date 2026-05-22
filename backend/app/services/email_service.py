# backend/app/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Servicio profesional para envío de emails con diseño corporativo"""

    @staticmethod
    def _get_smtp_connection():
        try:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            return server
        except Exception as e:
            logger.error(f"SMTP connection failed: {e}")
            raise

    @staticmethod
    def _generate_verification_email_html(
        name: str,
        verification_link: str,
        verification_code: str
    ) -> str:
        """Genera el HTML del email de verificación con diseño profesional y colores corporativos"""
        
        # Generar los cuadros del código de verificación
        code_digits_html = ""
        for digit in verification_code:
            code_digits_html += f"""
                <div style="
                    width: 52px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    font-size: 26px;
                    font-weight: 700;
                    color: #1f2937;
                    background-color: #ffffff;
                    border-radius: 12px;
                    border: 2px solid rgba(76, 175, 80, 0.3);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                ">
                    {digit}
                </div>
            """
        
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica tu cuenta - ERP Conversacional</title>
    <style>
        @media only screen and (max-width: 600px) {{
            .code-container {{
                flex-wrap: wrap !important;
                gap: 8px !important;
            }}
            .code-digit {{
                width: 44px !important;
                height: 52px !important;
                font-size: 22px !important;
            }}
            .main-table {{
                width: 95% !important;
            }}
            .content-padding {{
                padding: 24px 20px !important;
            }}
        }}
        @media only screen and (max-width: 480px) {{
            .code-digit {{
                width: 38px !important;
                height: 46px !important;
                font-size: 18px !important;
            }}
        }}
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f6f8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f6f8;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="main-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header con gradiente verde (Primary) -->
                    <tr>
                        <td style="text-align: center; padding: 40px 32px; background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); border-radius: 24px 24px 0 0;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255, 255, 255, 0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px;">📊</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                ERP Conversacional
                            </h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">
                                Tu negocio, simplificado
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Contenido principal -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 40px 32px;">
                            
                            <!-- Saludo -->
                            <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                ¡Hola, {name}! 👋
                            </h2>
                            
                            <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                                Gracias por registrarte en <strong style="color: #4caf50;">ERP Conversacional</strong>. 
                                Estamos emocionados de tenerte con nosotros.
                            </p>
                            
                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                                Para comenzar a usar tu cuenta y acceder a todas las funcionalidades, 
                                verifica tu email con el siguiente código:
                            </p>
                            
                            <!-- Código de verificación -->
                            <div style="text-align: center; margin: 32px 0;">
                                <div style="display: inline-block; background-color: #f8fafc; border-radius: 20px; padding: 28px 24px; border: 1px solid #e5e7eb;">
                                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                                        Tu código de verificación
                                    </p>
                                    <div class="code-container" style="display: flex; justify-content: center; gap: 12px; margin: 0; flex-wrap: wrap;">
                                        {code_digits_html}
                                    </div>
                                    <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                        Ingresa este código en la aplicación
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Separador -->
                            <div style="display: flex; align-items: center; gap: 16px; margin: 32px 0;">
                                <div style="flex: 1; height: 1px; background-color: #e5e7eb;"></div>
                                <span style="color: #9ca3af; font-size: 13px;">o haz clic en el botón</span>
                                <div style="flex: 1; height: 1px; background-color: #e5e7eb;"></div>
                            </div>
                            
                            <!-- Botón CTA -->
                            <div style="text-align: center; margin: 24px 0;">
                                <a href="{verification_link}" 
                                   style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); transition: all 0.2s;">
                                    ✓ Verificar mi cuenta
                                </a>
                            </div>
                            
                            <!-- Información de expiración -->
                            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 16px 20px; margin: 32px 0;">
                                <p style="margin: 0; color: #92400e; font-size: 13px; display: flex; align-items: flex-start; gap: 10px;">
                                    <span style="font-size: 16px;">⏰</span>
                                    <span>
                                        <strong>Este enlace expirará en 24 horas.</strong><br>
                                        Si no verificas tu cuenta antes, deberás solicitar un nuevo enlace.
                                    </span>
                                </p>
                            </div>
                            
                            <!-- Enlace alternativo -->
                            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin: 24px 0;">
                                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                                </p>
                                <p style="margin: 0; color: #4caf50; font-size: 12px; font-family: 'JetBrains Mono', monospace; background-color: #ffffff; padding: 10px 12px; border-radius: 8px; border: 1px solid #e5e7eb; word-break: break-all;">
                                    {verification_link}
                                </p>
                            </div>
                            
                            <!-- Disclaimer -->
                            <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.4; text-align: center;">
                                ¿No creaste esta cuenta? Puedes ignorar este mensaje de forma segura.
                            </p>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="text-align: center; padding: 24px 32px 32px; background-color: #ffffff; border-top: 1px solid #f0f2f5;">
                            <div style="display: flex; justify-content: center; gap: 24px; margin-bottom: 16px;">
                                <a href="#" style="color: #9ca3af; font-size: 12px; text-decoration: none;">Términos</a>
                                <span style="color: #e5e7eb;">•</span>
                                <a href="#" style="color: #9ca3af; font-size: 12px; text-decoration: none;">Privacidad</a>
                                <span style="color: #e5e7eb;">•</span>
                                <a href="#" style="color: #9ca3af; font-size: 12px; text-decoration: none;">Soporte</a>
                            </div>
                            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                © 2024 ERP Conversacional. Todos los derechos reservados.
                            </p>
                            <p style="margin: 8px 0 0 0; color: #cbd5e1; font-size: 11px;">
                                Este correo fue enviado porque te registraste en nuestra plataforma.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""
        
        return html_content

    @staticmethod
    def send_verification_email(
        to_email: str,
        verification_link: str,
        verification_code: str,
        name: Optional[str] = None
    ):
        """Envía email de verificación con diseño profesional"""
        try:
            logger.info(f"📧 Sending verification email to {to_email}")
            
            user_name = name if name else "Usuario"
            subject = "🔐 Verifica tu cuenta - ERP Conversacional"
            
            html_content = EmailService._generate_verification_email_html(
                name=user_name,
                verification_link=verification_link,
                verification_code=verification_code
            )
            
            text_content = f"""Hola {user_name},

Gracias por registrarte en ERP Conversacional.

Tu código de verificación es: {verification_code}

Para verificar tu cuenta, usa este enlace:
{verification_link}

Este enlace expirará en 24 horas.

Si no creaste esta cuenta, puedes ignorar este mensaje.

© 2024 ERP Conversacional
"""
            
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))
            
            server = EmailService._get_smtp_connection()
            server.send_message(msg)
            server.quit()
            
            logger.info(f"✅ Verification email sent to {to_email}")
            
        except Exception as e:
            logger.error(f"❌ Failed to send verification email: {e}")
            raise

    @staticmethod
    def send_welcome_email(to_email: str, name: str):
        """Envía email de bienvenida después de verificación exitosa"""
        try:
            logger.info(f"📧 Sending welcome email to {to_email}")
            
            subject = "🎉 ¡Bienvenido a ERP Conversacional!"
            
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a ERP Conversacional</title>
    <style>
        @media only screen and (max-width: 600px) {{
            .main-table {{
                width: 95% !important;
            }}
            .content-padding {{
                padding: 24px 20px !important;
            }}
        }}
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f6f8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f6f8;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="main-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header con gradiente -->
                    <tr>
                        <td style="text-align: center; padding: 40px 32px; background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); border-radius: 24px 24px 0 0;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255, 255, 255, 0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px;">🎉</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                ¡Bienvenido, {name}!
                            </h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">
                                Tu cuenta ha sido verificada exitosamente
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Contenido -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 40px 32px;">
                            
                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                                ¡Felicidades! Tu cuenta ya está activa. Ahora puedes comenzar a gestionar tu negocio.
                            </p>
                            
                            <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                                ✨ ¿Qué puedes hacer ahora?
                            </h3>
                            
                            <div style="margin-bottom: 32px;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <div style="width: 32px; height: 32px; background: #e8f5e9; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                        <span style="font-size: 16px;">🏢</span>
                                    </div>
                                    <span style="color: #374151;">Configurar los datos de tu negocio</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <div style="width: 32px; height: 32px; background: #e8f5e9; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                        <span style="font-size: 16px;">📦</span>
                                    </div>
                                    <span style="color: #374151;">Crear tus productos y servicios</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <div style="width: 32px; height: 32px; background: #e8f5e9; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                        <span style="font-size: 16px;">👥</span>
                                    </div>
                                    <span style="color: #374151;">Registrar tus clientes</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <div style="width: 32px; height: 32px; background: #e8f5e9; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                        <span style="font-size: 16px;">💰</span>
                                    </div>
                                    <span style="color: #374151;">Generar facturas electrónicas SRI</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 32px; height: 32px; background: #e8f5e9; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                        <span style="font-size: 16px;">💬</span>
                                    </div>
                                    <span style="color: #374151;">Vender por WhatsApp automáticamente</span>
                                </div>
                            </div>
                            
                            <!-- Botón CTA -->
                            <div style="text-align: center; margin: 32px 0 24px;">
                                <a href="{settings.FRONTEND_URL}/dashboard" 
                                   style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);">
                                    🚀 Ir al Dashboard
                                </a>
                            </div>
                            
                            <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
                                ¿Necesitas ayuda? Contacta a <a href="mailto:soporte@erp.com" style="color: #4caf50; text-decoration: none;">soporte@erp.com</a>
                            </p>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="text-align: center; padding: 24px 32px 32px; background-color: #ffffff; border-top: 1px solid #f0f2f5;">
                            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                © 2024 ERP Conversacional. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""
            
            text_content = f"""Bienvenido a ERP Conversacional, {name}!

Tu cuenta ha sido verificada exitosamente.

Ahora puedes:
- Configurar tu negocio
- Crear productos
- Registrar clientes
- Generar facturas electrónicas
- Vender por WhatsApp

Accede al dashboard: {settings.FRONTEND_URL}/dashboard

¿Necesitas ayuda? Contacta a soporte@erp.com
"""
            
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))
            
            server = EmailService._get_smtp_connection()
            server.send_message(msg)
            server.quit()
            
            logger.info(f"✅ Welcome email sent to {to_email}")
            
        except Exception as e:
            logger.error(f"❌ Failed to send welcome email: {e}")

    @staticmethod
    def send_password_reset_email(to_email: str, reset_link: str, name: str):   
            
            """Envía email para restablecer contraseña"""
            try:
                logger.info(f"📧 Sending password reset email to {to_email}")
                
                subject = "🔐 Restablece tu contraseña - ERP Conversacional"
                
                html_content = f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña</title>
        <style>
            @media only screen and (max-width: 600px) {{
                .main-table {{ width: 95% !important; }}
                .content-padding {{ padding: 24px 20px !important; }}
            }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f6f8; font-family: 'Inter', -apple-system, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f6f8;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table class="main-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);">
                        
                        <tr>
                            <td style="text-align: center; padding: 40px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 24px 24px 0 0;">
                                <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255, 255, 255, 0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                                    <span style="font-size: 32px;">🔐</span>
                                </div>
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                    Restablecer Contraseña
                                </h1>
                            </td>
                        </tr>
                        
                        <tr>
                            <td class="content-padding" style="padding: 40px 40px 32px;">
                                
                                <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px;">
                                    ¡Hola, {name}!
                                </h2>
                                
                                <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                                    Recibimos una solicitud para restablecer la contraseña de tu cuenta en ERP Conversacional.
                                </p>
                                
                                <div style="text-align: center; margin: 32px 0;">
                                    <a href="{reset_link}" 
                                    style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                                        Restablecer contraseña
                                    </a>
                                </div>
                                
                                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 16px 20px; margin: 32px 0;">
                                    <p style="margin: 0; color: #92400e; font-size: 13px;">
                                        ⏰ <strong>Este enlace expirará en 24 horas.</strong><br>
                                        Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.
                                    </p>
                                </div>
                                
                                <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                    © 2024 ERP Conversacional
                                </p>
                                
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>"""
                
                text_content = f"""Hola {name},

    Recibimos una solicitud para restablecer la contraseña de tu cuenta en ERP Conversacional.

    Para restablecer tu contraseña, usa este enlace:
    {reset_link}

    Este enlace expirará en 24 horas.

    Si no solicitaste este cambio, puedes ignorar este mensaje.
    """
                
                msg = MIMEMultipart("alternative")
                msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
                msg["To"] = to_email
                msg["Subject"] = subject
                
                msg.attach(MIMEText(text_content, "plain"))
                msg.attach(MIMEText(html_content, "html"))
                
                server = EmailService._get_smtp_connection()
                server.send_message(msg)
                server.quit()
                
                logger.info(f"✅ Password reset email sent to {to_email}")
                
            except Exception as e:
                logger.error(f"❌ Failed to send password reset email: {e}")
                raise


    # backend/app/services/email_service.py
    # Agrega este método DESPUÉS de send_welcome_email

    @staticmethod
    def send_employee_credentials_email(
        to_email: str,
        name: str,
        username: str,
        password: str,
        login_url: str = None
    ):
        """Envía email con credenciales al nuevo empleado"""
        try:
            logger.info(f"📧 Sending employee credentials email to {to_email}")
            
            login_link = login_url or f"{settings.FRONTEND_URL}/login"
            subject = "🔐 Tus credenciales de acceso - ERP Conversacional"
            
            html_content = f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Credenciales de acceso</title>
        <style>
            @media only screen and (max-width: 600px) {{
                .main-table {{ width: 95% !important; }}
                .content-padding {{ padding: 24px 20px !important; }}
            }}
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f6f8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f6f8;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table class="main-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="text-align: center; padding: 40px 32px; background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); border-radius: 24px 24px 0 0;">
                                <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255, 255, 255, 0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                                    <span style="font-size: 32px;">🔐</span>
                                </div>
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                    ¡Bienvenido al equipo, {name}!
                                </h1>
                                <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">
                                    Tu cuenta ha sido creada en ERP Conversacional
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Contenido -->
                        <tr>
                            <td class="content-padding" style="padding: 40px 40px 32px;">
                                
                                <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                                    Se ha creado una cuenta para ti en <strong style="color: #4caf50;">ERP Conversacional</strong>. 
                                    Usa las siguientes credenciales para acceder:
                                </p>
                                
                                <!-- Credenciales -->
                                <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                        <span style="color: #6b7280; font-size: 14px;">👤 Usuario</span>
                                        <span style="font-weight: 600; color: #1f2937; font-size: 16px; font-family: 'JetBrains Mono', monospace;">{username}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                                        <span style="color: #6b7280; font-size: 14px;">🔑 Contraseña temporal</span>
                                        <span style="font-weight: 600; color: #1f2937; font-size: 16px; font-family: 'JetBrains Mono', monospace;">{password}</span>
                                    </div>
                                </div>
                                
                                <p style="margin: 0 0 16px 0; color: #92400e; font-size: 13px; background-color: #fffbeb; padding: 12px 16px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                                    ⚠️ <strong>Importante:</strong> Esta contraseña es temporal. Deberás cambiarla en tu primer inicio de sesión.
                                </p>
                                
                                <!-- Botón CTA -->
                                <div style="text-align: center; margin: 32px 0 24px;">
                                    <a href="{login_link}" 
                                    style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);">
                                        🚀 Iniciar sesión
                                    </a>
                                </div>
                                
                                <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
                                    ¿Necesitas ayuda? Contacta a <a href="mailto:soporte@erp.com" style="color: #4caf50; text-decoration: none;">soporte@erp.com</a>
                                </p>
                                
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="text-align: center; padding: 24px 32px 32px; background-color: #ffffff; border-top: 1px solid #f0f2f5;">
                                <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                    © 2024 ERP Conversacional. Todos los derechos reservados.
                                </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>"""
            
            text_content = f"""¡Bienvenido al equipo, {name}!

    Tu cuenta ha sido creada en ERP Conversacional.

    Credenciales de acceso:
    - Usuario: {username}
    - Contraseña temporal: {password}

    ⚠️ Deberás cambiar tu contraseña en el primer inicio de sesión.

    Accede aquí: {login_link}

    ¿Necesitas ayuda? Contacta a soporte@erp.com
    """
            
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))
            
            server = EmailService._get_smtp_connection()
            server.send_message(msg)
            server.quit()
            
            logger.info(f"✅ Employee credentials email sent to {to_email}")
            
        except Exception as e:
            logger.error(f"❌ Failed to send employee credentials email: {e}")

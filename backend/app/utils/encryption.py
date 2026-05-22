"""
Utilidades de encriptación para datos sensibles
"""
import base64
import os
from typing import Tuple

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from app.core.config import settings


class EncryptionManager:
    """Manejador de encriptación para datos sensibles"""

    def __init__(self):
        # Derivar clave del secret key para Fernet
        self.fernet_key = self._derive_key(settings.SECRET_KEY, salt=b'fernet_salt')
        self.fernet = Fernet(self.fernet_key)

    def _derive_key(self, secret: str, salt: bytes, length: int = 32) -> bytes:
        """Deriva una clave usando PBKDF2"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=length,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
        return key

    def encrypt(self, data: str) -> str:
        """Encripta datos sensibles"""
        if not data:
            return ""
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """Desencripta datos sensibles"""
        if not encrypted_data:
            return ""
        return self.fernet.decrypt(encrypted_data.encode()).decode()

    def encrypt_dict(self, data: dict, fields: list) -> dict:
        """Encripta campos específicos de un diccionario"""
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = self.encrypt(str(result[field]))
        return result

    def decrypt_dict(self, data: dict, fields: list) -> dict:
        """Desencripta campos específicos de un diccionario"""
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = self.decrypt(result[field])
        return result

    @staticmethod
    def encrypt_certificate_aes(cert_bytes: bytes, key: bytes) -> bytes:
        """
        Encrypt certificate bytes using AES-CFB.
        Returns IV + ciphertext.
        """
        iv = os.urandom(16)
        cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        return iv + encryptor.update(cert_bytes) + encryptor.finalize()


# Singleton
encryption_manager = EncryptionManager()

# Funciones de conveniencia
def encrypt_value(value: str) -> str:
    return encryption_manager.encrypt(value)


def decrypt_value(value: str) -> str:
    return encryption_manager.decrypt(value)


class CertificateEncryption:
    """Manejo especial para certificados digitales"""

    @staticmethod
    def encrypt_certificate(cert_content: bytes, password: str) -> Tuple[str, str]:
        """
        Encripta certificado digital y su contraseña.
        Retorna (cert_encriptado, password_encriptada)
        """
        # Encriptar certificado con clave derivada
        cert_key = encryption_manager._derive_key(
            settings.SECRET_KEY + "_cert",
            salt=b'cert_salt'
        )
        cert_fernet = Fernet(cert_key)
        encrypted_cert = cert_fernet.encrypt(cert_content).decode()

        # Encriptar contraseña con método normal
        encrypted_password = encryption_manager.encrypt(password)

        return encrypted_cert, encrypted_password

    @staticmethod
    def decrypt_certificate(encrypted_cert: str, encrypted_password: str) -> Tuple[bytes, str]:
        """
        Desencripta certificado y su contraseña
        """
        cert_key = encryption_manager._derive_key(
            settings.SECRET_KEY + "_cert",
            salt=b'cert_salt'
        )
        cert_fernet = Fernet(cert_key)
        cert_bytes = cert_fernet.decrypt(encrypted_cert.encode())

        password = encryption_manager.decrypt(encrypted_password)

        return cert_bytes, password
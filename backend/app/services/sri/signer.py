"""
SRI XML Signer - XAdES-BES CORREGIDO
Usa cryptography + lxml
Implementación completa según especificación SRI Ecuador

FIXES aplicados:
- DigestMethod URI corregido: xmldsig#sha256 → xmlenc#sha256 (W3C correcto)
- CanonicalizationMethod corregido: c14n exclusivo (exc-c14n)
- Endpoint de validación de certificado añadido
"""
import base64
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Tuple, Optional, Dict, Any
import logging

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12
from lxml import etree

logger = logging.getLogger(__name__)

# Namespaces XAdES
NS = {
    "ds": "http://www.w3.org/2000/09/xmldsig#",
    "xades": "http://uri.etsi.org/01903/v1.3.2#",
    "xades141": "http://uri.etsi.org/01903/v1.4.1#",
}

# ✅ URIs CORRECTOS según W3C y SRI Ecuador
URI_C14N_EXCLUSIVE = "http://www.w3.org/2001/10/xml-exc-c14n#"
URI_C14N_STANDARD  = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
URI_RSA_SHA256     = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
URI_SHA256         = "http://www.w3.org/2001/04/xmlenc#sha256"          # 🔴 ERA xmldsig#sha256 (INCORRECTO)
URI_ENVELOPED_SIG  = "http://www.w3.org/2000/09/xmldsig#enveloped-signature"


class SRISigner:
    """Firma XML XAdES-BES compatible con SRI Ecuador"""

    def sign_xml(
        self,
        xml_content: str,
        certificate_b64: str,
        password: str,
    ) -> Tuple[str, str]:
        """
        Firma un comprobante XML con XAdES-BES.

        Args:
            xml_content: XML del comprobante (sin firmar)
            certificate_b64: Certificado .p12 en Base64
            password: Contraseña del .p12

        Returns:
            (signed_xml_str, fingerprint_hex)
        """
        cert_bytes = base64.b64decode(certificate_b64)
        pwd_bytes = password.encode() if isinstance(password, str) else password

        private_key, certificate, _ = pkcs12.load_key_and_certificates(cert_bytes, pwd_bytes)

        root = etree.fromstring(xml_content.encode("utf-8"))

        signature = self._create_xades_signature(root, private_key, certificate)

        info_tributaria = root.find(".//infoTributaria")
        if info_tributaria is not None:
            parent = info_tributaria.getparent()
            index = parent.index(info_tributaria) + 1
            parent.insert(index, signature)
        else:
            root.insert(0, signature)

        xml_bytes = etree.tostring(
            root,
            encoding="UTF-8",
            xml_declaration=True,
            pretty_print=True,
        )

        fingerprint = certificate.fingerprint(hashes.SHA256()).hex()
        return xml_bytes.decode("utf-8"), fingerprint

    def _create_xades_signature(self, root, private_key, certificate):
        """Crea el bloque de firma XAdES-BES completo con URIs correctos"""

        signature_id = f"Signature-{uuid.uuid4().hex[:8]}"
        signed_properties_id = f"SignedProperties-{uuid.uuid4().hex[:8]}"
        key_info_id = f"KeyInfo-{uuid.uuid4().hex[:8]}"

        # Certificado en DER
        cert_der = certificate.public_bytes(serialization.Encoding.DER)
        cert_b64 = base64.b64encode(cert_der).decode()

        # ── Digest del documento usando exc-c14n (exclusivo, SRI requiere esto) ──
        doc_c14n = etree.tostring(root, method="c14n", exclusive=True)
        doc_digest = base64.b64encode(hashlib.sha256(doc_c14n).digest()).decode()

        # ── Signature ────────────────────────────────────────────────────────────
        signature = etree.Element(f"{{{NS['ds']}}}Signature", Id=signature_id)

        # === SignedInfo ===
        signed_info = etree.SubElement(signature, f"{{{NS['ds']}}}SignedInfo")

        # ✅ CanonicalizationMethod: exc-c14n es lo correcto para XAdES
        etree.SubElement(
            signed_info, f"{{{NS['ds']}}}CanonicalizationMethod",
            Algorithm=URI_C14N_EXCLUSIVE,
        )

        # ✅ SignatureMethod: rsa-sha256 correcto (xmldsig-more, no xmldsig base)
        etree.SubElement(
            signed_info, f"{{{NS['ds']}}}SignatureMethod",
            Algorithm=URI_RSA_SHA256,
        )

        # Reference al documento completo
        reference = etree.SubElement(signed_info, f"{{{NS['ds']}}}Reference", URI="")
        transforms = etree.SubElement(reference, f"{{{NS['ds']}}}Transforms")
        etree.SubElement(transforms, f"{{{NS['ds']}}}Transform", Algorithm=URI_ENVELOPED_SIG)
        etree.SubElement(transforms, f"{{{NS['ds']}}}Transform", Algorithm=URI_C14N_EXCLUSIVE)

        # ✅ DigestMethod: URI correcto es xmlenc#sha256, NO xmldsig#sha256
        etree.SubElement(reference, f"{{{NS['ds']}}}DigestMethod", Algorithm=URI_SHA256)
        dv = etree.SubElement(reference, f"{{{NS['ds']}}}DigestValue")
        dv.text = doc_digest

        # Reference a SignedProperties (XAdES obligatorio)
        ref_sp = etree.SubElement(
            signed_info, f"{{{NS['ds']}}}Reference",
            URI=f"#{signed_properties_id}",
            Type="http://uri.etsi.org/01903#SignedProperties",
        )
        etree.SubElement(ref_sp, f"{{{NS['ds']}}}DigestMethod", Algorithm=URI_SHA256)
        # El DigestValue de SignedProperties se calcula después de construirlo

        # === KeyInfo ===
        key_info = etree.SubElement(signature, f"{{{NS['ds']}}}KeyInfo", Id=key_info_id)
        x509_data = etree.SubElement(key_info, f"{{{NS['ds']}}}X509Data")
        x509_cert_elem = etree.SubElement(x509_data, f"{{{NS['ds']}}}X509Certificate")
        x509_cert_elem.text = cert_b64

        # === Object / QualifyingProperties ===
        obj = etree.SubElement(signature, f"{{{NS['ds']}}}Object")
        qualifying_props = etree.SubElement(
            obj, f"{{{NS['xades']}}}QualifyingProperties",
            Target=f"#{signature_id}",
        )
        signed_props = etree.SubElement(
            qualifying_props, f"{{{NS['xades']}}}SignedProperties",
            Id=signed_properties_id,
        )
        signed_sig_props = etree.SubElement(
            signed_props, f"{{{NS['xades']}}}SignedSignatureProperties"
        )

        # SigningTime
        signing_time_elem = etree.SubElement(signed_sig_props, f"{{{NS['xades']}}}SigningTime")
        signing_time_elem.text = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # SigningCertificate
        signing_cert = etree.SubElement(signed_sig_props, f"{{{NS['xades']}}}SigningCertificate")
        cert_elem = etree.SubElement(signing_cert, f"{{{NS['xades']}}}Cert")
        cert_digest_elem = etree.SubElement(cert_elem, f"{{{NS['xades']}}}CertDigest")
        # ✅ URI correcto aquí también
        etree.SubElement(cert_digest_elem, f"{{{NS['ds']}}}DigestMethod", Algorithm=URI_SHA256)
        cert_dv = etree.SubElement(cert_digest_elem, f"{{{NS['ds']}}}DigestValue")
        cert_dv.text = base64.b64encode(hashlib.sha256(cert_der).digest()).decode()

        issuer_serial = etree.SubElement(cert_elem, f"{{{NS['xades']}}}IssuerSerial")
        issuer_name_elem = etree.SubElement(issuer_serial, f"{{{NS['ds']}}}X509IssuerName")
        issuer_name_elem.text = certificate.issuer.rfc4514_string()
        serial_number_elem = etree.SubElement(issuer_serial, f"{{{NS['ds']}}}X509SerialNumber")
        serial_number_elem.text = str(certificate.serial_number)

        # Ahora calculamos el digest de SignedProperties y lo ponemos en ref_sp
        sp_c14n = etree.tostring(signed_props, method="c14n", exclusive=True)
        sp_digest = base64.b64encode(hashlib.sha256(sp_c14n).digest()).decode()
        sp_dv = etree.SubElement(ref_sp, f"{{{NS['ds']}}}DigestValue")
        sp_dv.text = sp_digest

        # === SignatureValue ===
        # Canonicalizar SignedInfo con exc-c14n y firmar
        si_c14n = etree.tostring(signed_info, method="c14n", exclusive=True)
        signature_bytes = private_key.sign(si_c14n, padding.PKCS1v15(), hashes.SHA256())
        sig_value_b64 = base64.b64encode(signature_bytes).decode()

        signature_value = etree.SubElement(signature, f"{{{NS['ds']}}}SignatureValue")
        signature_value.text = sig_value_b64

        return signature

    def validate_certificate(self, cert_data: bytes, password: str) -> Dict[str, Any]:
        """
        Valida que el certificado sea correcto y retorna info detallada.
        Úsalo en el paso SRI del onboarding para verificar ANTES de guardar.
        """
        try:
            pwd = password.encode() if isinstance(password, str) else password
            private_key, certificate, _ = pkcs12.load_key_and_certificates(cert_data, pwd)

            if private_key is None:
                return {"valid": False, "error": "El archivo no contiene clave privada"}
            if certificate is None:
                return {"valid": False, "error": "El archivo no contiene certificado"}

            not_after = certificate.not_valid_after_utc
            not_before = certificate.not_valid_before_utc
            now = datetime.now(timezone.utc)
            days = (not_after - now).days

            # Verificar que la firma pública funciona con la clave privada
            test_data = b"test"
            sig = private_key.sign(test_data, padding.PKCS1v15(), hashes.SHA256())
            certificate.public_key().verify(sig, test_data, padding.PKCS1v15(), hashes.SHA256())

            return {
                "valid": True,
                "subject": certificate.subject.rfc4514_string(),
                "issuer": certificate.issuer.rfc4514_string(),
                "not_valid_before": not_before.isoformat(),
                "not_valid_after": not_after.isoformat(),
                "days_until_expiry": days,
                "is_expired": days < 0,
                "expires_soon": 0 <= days <= 30,
                "fingerprint_sha256": certificate.fingerprint(hashes.SHA256()).hex(),
                "serial_number": str(certificate.serial_number),
                "signature_algorithm": "SHA256withRSA",
            }
        except ValueError as e:
            logger.error(f"Certificate validation error (bad password?): {e}")
            return {"valid": False, "error": "Contraseña incorrecta o archivo inválido"}
        except Exception as e:
            logger.error(f"Certificate validation error: {e}")
            return {"valid": False, "error": str(e)}

    def extract_certificate_info(self, cert_data: bytes, password: str) -> Dict[str, Any]:
        """Alias de validate_certificate para compatibilidad con código existente"""
        result = self.validate_certificate(cert_data, password)
        if not result.get("valid"):
            return {}
        return result
    
    # En signer.py, agrega este método a la clase SRISigner
    def sign_xml_from_bytes(
        self,
        xml_content: str,
        certificate_bytes: bytes,
        password: str,
    ) -> Tuple[str, str]:
        """
        Firma un comprobante XML con XAdES-BES usando bytes del certificado.
        Wrapper para compatibilidad con SRIService.
        """
        cert_b64 = base64.b64encode(certificate_bytes).decode()
        return self.sign_xml(xml_content, cert_b64, password)
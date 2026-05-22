import React from 'react';
import { Helmet } from 'react-helmet-async';

const Privacy: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Política de Privacidad - ERP Conversacional Ecuador</title>
      </Helmet>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
        <div className="prose prose-emerald prose-lg">
          <p className="text-gray-600 mb-4">Última actualización: {new Date().toLocaleDateString('es-EC')}</p>
          
          <h2>1. Información que Recopilamos</h2>
          <p>Recopilamos información que usted nos proporciona directamente: nombre, email, RUC, teléfono, dirección. También recopilamos información automáticamente: IP, tipo de navegador, páginas visitadas.</p>
          
          <h2>2. Uso de la Información</h2>
          <p>Usamos su información para: proveer el servicio, facturación, soporte, mejoras del producto, y cumplir con obligaciones legales.</p>
          
          <h2>3. Compartir Información</h2>
          <p>No vendemos su información. Podemos compartirla con: el SRI (para facturación), proveedores de pago (Stripe), y cuando la ley lo requiera.</p>
          
          <h2>4. Seguridad de los Datos</h2>
          <p>Implementamos medidas de seguridad (encriptación TLS, hashing de contraseñas, backups cifrados) para proteger su información.</p>
          
          <h2>5. Cookies</h2>
          <p>Usamos cookies para autenticación, sesiones y análisis. Puede deshabilitarlas en su navegador.</p>
          
          <h2>6. Derechos del Usuario (Ley Orgánica de Datos Ecuador)</h2>
          <p>Usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento de sus datos. Contáctenos para ejercer estos derechos.</p>
          
          <h2>7. Retención de Datos</h2>
          <p>Conservamos sus datos mientras su cuenta esté activa y hasta 5 años después por obligaciones fiscales.</p>
          
          <h2>8. Cambios a esta Política</h2>
          <p>Notificaremos cambios importantes por email o mediante un aviso en el sitio.</p>
          
          <h2>9. Contacto</h2>
          <p>Para asuntos de privacidad: <a href="mailto:datos@erpecuador.com" className="text-emerald-600 hover:text-emerald-700">datos@erpecuador.com</a>.</p>
        </div>
      </div>
    </>
  );
};

export default Privacy;
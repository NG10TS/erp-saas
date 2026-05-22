import React from 'react';
import { Helmet } from 'react-helmet-async';

const Terms: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Términos y Condiciones - ERP Conversacional Ecuador</title>
      </Helmet>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>
        <div className="prose prose-emerald prose-lg">
          <p className="text-gray-600 mb-4">Última actualización: {new Date().toLocaleDateString('es-EC')}</p>
          
          <h2>1. Aceptación de los Términos</h2>
          <p>Al utilizar ERP Conversacional Ecuador ("el Servicio"), usted acepta cumplir con estos Términos y Condiciones.</p>
          
          <h2>2. Descripción del Servicio</h2>
          <p>ERP Conversacional Ecuador es una plataforma SaaS que permite a microempresas y PYMES gestionar ventas, inventario y facturación electrónica a través de WhatsApp.</p>
          
          <h2>3. Registro y Cuenta</h2>
          <p>Para utilizar el Servicio, debe registrarse proporcionando información veraz. Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta.</p>
          
          <h2>4. Planes y Pagos</h2>
          <p>Ofrecemos planes mensuales y anuales. Los pagos se procesan a través de Stripe. Las suscripciones se renuevan automáticamente hasta que se cancelen.</p>
          
          <h2>5. Obligaciones del Usuario</h2>
          <p>Usted se compromete a no utilizar el Servicio para actividades ilegales, y a cumplir con las leyes ecuatorianas, incluyendo las obligaciones tributarias del SRI.</p>
          
          <h2>6. Facturación Electrónica</h2>
          <p>El Servicio genera comprobantes electrónicos válidos ante el SRI. Usted es responsable de contar con un certificado digital vigente y de verificar la correcta emisión.</p>
          
          <h2>7. Cancelación y Reembolsos</h2>
          <p>Puede cancelar su suscripción en cualquier momento. No se realizan reembolsos por períodos parciales no utilizados.</p>
          
          <h2>8. Modificaciones del Servicio</h2>
          <p>Nos reservamos el derecho de modificar o interrumpir el Servicio en cualquier momento, con previo aviso.</p>
          
          <h2>9. Limitación de Responsabilidad</h2>
          <p>No somos responsables por daños indirectos, pérdida de datos o lucro cesante derivados del uso del Servicio.</p>
          
          <h2>10. Ley Aplicable</h2>
          <p>Estos términos se rigen por las leyes de la República del Ecuador.</p>
          
          <h2>11. Contacto</h2>
          <p>Para consultas, escríbanos a <a href="mailto:soporte@erpecuador.com" className="text-emerald-600 hover:text-emerald-700">soporte@erpecuador.com</a> o por WhatsApp al +593 99 999 9999.</p>
        </div>
      </div>
    </>
  );
};

export default Terms;
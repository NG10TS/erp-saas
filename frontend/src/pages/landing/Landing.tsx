import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSteps from '@/components/landing/SolutionSteps';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import DemoSection from '@/components/landing/DemoSection';
import Pricing from '@/components/landing/Pricing';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import ChatWidget from '@/components/landing/ChatWidget';

const Landing: React.FC = () => {
  // Smooth scroll para anclas
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.hash && anchor.hash.startsWith('#') && anchor.pathname === window.location.pathname) {
        e.preventDefault();
        const element = document.querySelector(anchor.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <>
      <Helmet>
        <title>ERP Conversacional Ecuador - Gestiona tu negocio desde WhatsApp</title>
        <meta name="description" content="El primer ERP que permite a PYMES ecuatorianas gestionar ventas, inventario y facturación electrónica 100% desde WhatsApp. Integración SRI oficial." />
        <meta name="keywords" content="ERP, WhatsApp, facturación electrónica, SRI, Ecuador, PYMES, inventario" />
        <meta property="og:title" content="ERP Conversacional Ecuador" />
        <meta property="og:description" content="Automatiza ventas y facturación desde WhatsApp. Prueba gratis." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet" />
      </Helmet>
      <div className="bg-white font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Navbar />
        <main>
          <Hero />
          <ProblemSection />
          <SolutionSteps />
          <FeaturesGrid />
          <DemoSection />
          <Pricing />
          <Testimonials />
          <FAQ />
        </main>
        <Footer />
        <ChatWidget />
      </div>
    </>
  );
};

export default Landing;
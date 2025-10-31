import React from 'react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export default function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}


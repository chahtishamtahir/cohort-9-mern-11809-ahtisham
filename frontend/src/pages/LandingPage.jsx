import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { CaptureSpotlight } from '../components/landing/CaptureSpotlight';
import { OrganizeSpotlight } from '../components/landing/OrganizeSpotlight';
import { SearchSpotlight } from '../components/landing/SearchSpotlight';
import { BenefitsGrid } from '../components/landing/BenefitsGrid';

export const LandingPage = () => {
  return (
    <main>
      <HeroSection />
      <CaptureSpotlight />
      <OrganizeSpotlight />
      <SearchSpotlight />
      <BenefitsGrid />
    </main>
  );
};

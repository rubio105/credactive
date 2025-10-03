// Stock images mapping for quiz categories
import cyberAwareness1 from '@assets/stock_images/cybersecurity_awaren_c696312f.jpg';
import cyberAwareness2 from '@assets/stock_images/cybersecurity_awaren_ffebea53.jpg';
import cyberAwareness3 from '@assets/stock_images/cybersecurity_awaren_afbd8f38.jpg';

import certification1 from '@assets/stock_images/professional_certifi_3fa8fd3e.jpg';
import certification2 from '@assets/stock_images/professional_certifi_877f44af.jpg';

import gdprPrivacy1 from '@assets/stock_images/data_privacy_gdpr_co_8d6b826e.jpg';
import gdprPrivacy2 from '@assets/stock_images/data_privacy_gdpr_co_1ae2fa84.jpg';
import gdprPrivacy3 from '@assets/stock_images/data_privacy_gdpr_co_435870f2.jpg';

import aiSecurity1 from '@assets/stock_images/artificial_intellige_ca0a2be4.jpg';
import aiSecurity2 from '@assets/stock_images/artificial_intellige_cd97e0db.jpg';

import threatIntel1 from '@assets/stock_images/threat_intelligence__afd6dd61.jpg';
import threatIntel2 from '@assets/stock_images/threat_intelligence__1d6e9a7c.jpg';

import iso27001_1 from '@assets/stock_images/iso_27001_compliance_30e7cd0c.jpg';
import iso27001_2 from '@assets/stock_images/iso_27001_compliance_3dc48003.jpg';

import secOps1 from '@assets/stock_images/security_operations__8c181b6b.jpg';
import secOps2 from '@assets/stock_images/security_operations__36c08bf5.jpg';

import dataProtection1 from '@assets/stock_images/data_protection_encr_48263cce.jpg';
import dataProtection2 from '@assets/stock_images/data_protection_encr_c4a6bde2.jpg';

import leadership1 from '@assets/stock_images/professional_leaders_6a93cbaf.jpg';
import leadership2 from '@assets/stock_images/professional_leaders_be86b888.jpg';

export const categoryImages = {
  'cyber-security-awareness': [cyberAwareness1, cyberAwareness2, cyberAwareness3],
  'cism': [certification1, certification2],
  'cissp': [certification1, certification2],
  'iso-27001': [iso27001_1, iso27001_2],
  'gdpr': [gdprPrivacy1, gdprPrivacy2, gdprPrivacy3],
  'eu-privacy': [gdprPrivacy1, gdprPrivacy3],
  'ai-security': [aiSecurity1, aiSecurity2],
  'data-protection-privacy': [dataProtection1, dataProtection2],
  'threat-intelligence-ai': [threatIntel1, threatIntel2],
  'secops-ai': [secOps1, secOps2],
  'assessment-leadership': [leadership1, leadership2],
};

// Helper to get a random image for a category
export function getCategoryImage(categorySlug: string): string | undefined {
  const images = categoryImages[categorySlug as keyof typeof categoryImages];
  if (!images || images.length === 0) return undefined;
  return images[Math.floor(Math.random() * images.length)];
}

// Get all images for a category
export function getAllCategoryImages(categorySlug: string): string[] {
  return categoryImages[categorySlug as keyof typeof categoryImages] || [];
}

// Featured images for landing page sections
export const featuredImages = {
  hero: cyberAwareness1,
  certifications: certification1,
  compliance: iso27001_1,
  ai: aiSecurity1,
  threatIntel: threatIntel1,
  secOps: secOps1,
};

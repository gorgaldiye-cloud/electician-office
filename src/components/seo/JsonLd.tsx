import React, { useEffect } from 'react';
import { repository } from '../../data';

export const JsonLd: React.FC = () => {
  const settings = repository.getSettings();
  const services = repository.getServices();
  const faqs = repository.getFAQs();

  useEffect(() => {
    // Electrician / LocalBusiness Schema
    const localBusinessSchema = {
      '@context': 'https://schema.org',
      '@type': 'Electrician',
      name: settings.name,
      description: 'Certified residential and commercial electrical services in Pakistan. Panel upgrades, breaker repairs, solar integration, and 24/7 emergency electrical dispatch.',
      telephone: settings.phone,
      email: settings.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.addressEn,
        addressLocality: settings.city,
        addressCountry: 'PK',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '24.8607',
        longitude: '67.0011',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '09:00',
          closes: '19:00',
        },
      ],
      areaServed: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi'],
    };

    // FAQPage Schema
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.questionEn,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answerEn,
        },
      })),
    };

    const script1 = document.createElement('script');
    script1.type = 'application/ld+json';
    script1.text = JSON.stringify(localBusinessSchema);
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.type = 'application/ld+json';
    script2.text = JSON.stringify(faqSchema);
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [settings, faqs]);

  return null;
};

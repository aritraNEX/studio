
"use client";

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

export function AdBanner() {
  const adClient = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID;
  const adSlot = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_AD_UNIT_ID;

  useEffect(() => {
    const pushAd = () => {
        try {
          if (typeof window !== 'undefined' && window.adsbygoogle) {
            window.adsbygoogle.push({});
          }
        } catch (err) {
          console.error('AdSense error:', err);
        }
    };

    // Delay the ad push slightly to ensure the container has a valid width.
    const timeout = setTimeout(pushAd, 100);

    return () => clearTimeout(timeout);
  }, []);

  if (!adClient || !adSlot) {
    return null; // Don't render anything if ad IDs are not configured
  }

  return (
    <div className="w-full py-4 flex justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}

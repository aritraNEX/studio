"use client";

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  adSlot: string;
  adClient: string;
}

export function AdBanner({ adSlot, adClient }: AdBannerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error(`Ad push failed for slot ${adSlot}:`, err);
      }
    }
  }, [isMounted, adSlot]);

  if (!isMounted) {
    return null; // Don't render on the server
  }

  return (
    <div className="w-full my-4 flex justify-center">
        <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '90px' }}
            data-ad-client={adClient}
            data-ad-slot={adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
            key={adSlot}
        ></ins>
    </div>
  );
}

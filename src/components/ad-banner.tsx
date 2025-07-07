'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

const AdBanner = () => {
  const pathname = usePathname();
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if the ad container has a width. If not, don't push the ad.
    if (adRef.current && adRef.current.offsetWidth === 0) {
      console.warn("Ad container has no width, skipping ad push.");
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, [pathname]);

  return (
    <div ref={adRef} className="w-full text-center my-4 min-h-[100px] flex items-center justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1743205890050653"
        data-ad-slot="9791852196"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;

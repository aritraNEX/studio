'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

const AdBanner = ({ adSlot }: { adSlot: string }) => {
  const pathname = usePathname();

  useEffect(() => {
    // A small delay can help ensure the ad container is rendered and sized,
    // preventing a race condition.
    const timeout = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error("Ad push failed", err);
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [pathname, adSlot]);

  return (
    <div className="w-full text-center my-4 min-h-[100px] flex items-center justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1743205890050653"
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;

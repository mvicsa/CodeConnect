'use client'

import Image from 'next/image';
import { useState } from 'react';

export default function TestAvatar() {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    console.log('TestAvatar: Image failed to load');
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('TestAvatar: Image loaded successfully');
    setImageLoaded(true);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-bold mb-4">AI Avatar Test</h3>
      
      <div className="space-y-4">
        {/* Test 1: Direct Image component */}
        <div>
          <h4 className="font-semibold mb-2">Test 1: Direct Image</h4>
          <Image
            src="/ai.avif"
            alt="AI Avatar Test"
            width={50}
            height={50}
            className="rounded-full border-2"
            onError={handleImageError}
            onLoad={handleImageLoad}
            unoptimized={true}
          />
          <p className="text-sm mt-1">
            Status: {imageError ? '❌ Error' : imageLoaded ? '✅ Loaded' : '⏳ Loading...'}
          </p>
        </div>

        {/* Test 2: Regular img tag */}
        <div>
          <h4 className="font-semibold mb-2">Test 2: Regular img tag</h4>
          <img
            src="/ai.avif"
            alt="AI Avatar Test"
            width={50}
            height={50}
            className="rounded-full border-2"
            onError={() => console.log('Regular img failed')}
            onLoad={() => console.log('Regular img loaded')}
          />
        </div>

        {/* Test 3: UserAvatar component */}
        <div>
          <h4 className="font-semibold mb-2">Test 3: UserAvatar Component</h4>
          <div className="flex items-center gap-2">
            <UserAvatar aiSrc="/ai.avif" ai="AI" size={50} />
            <span className="text-sm">UserAvatar with aiSrc</span>
          </div>
        </div>

        {/* Test 4: UserAvatar without aiSrc */}
        <div>
          <h4 className="font-semibold mb-2">Test 4: UserAvatar without aiSrc</h4>
          <div className="flex items-center gap-2">
            <UserAvatar ai="AI" size={50} />
            <span className="text-sm">UserAvatar without aiSrc</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import UserAvatar for the test
import UserAvatar from './UserAvatar'; 
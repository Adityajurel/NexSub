import React from 'react';

export const BrandLogo = ({ className = '', alt = 'NexSub logo' }) => (
  <img
    src="/nexsub-logo.png"
    alt={alt}
    className={`object-contain ${className}`}
  />
);

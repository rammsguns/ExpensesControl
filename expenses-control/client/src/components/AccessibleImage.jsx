import React from 'react';

/**
 * AccessibleImage - Image component with proper alt text support
 * Following WCAG guidelines for visual disabilities
 */
export default function AccessibleImage({ src, alt, description, className = '', ...props }) {
  // If no alt text provided, mark as decorative
  const isDecorative = !alt;
  
  return (
    <img
      src={src}
      alt={isDecorative ? '' : alt}
      aria-describedby={description ? `img-desc-${props.id}` : undefined}
      className={className}
      {...props}
    />
  );
}

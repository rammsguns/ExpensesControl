import React from 'react';

/**
 * SkipLink - Allows keyboard users to skip to main content
 * Essential for screen reader users to bypass navigation
 */
export default function SkipLink({ targetId = 'main-content' }) {
  const handleClick = (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:font-medium"
    >
      Skip to main content
    </a>
  );
}

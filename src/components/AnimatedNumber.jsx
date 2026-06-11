import React, { useState, useEffect } from 'react';

/**
 * Animated number counter component
 * @param {Object} props
 * @param {number|string} props.value - Target value
 * @param {string} [props.prefix=''] - Numeric prefix (e.g. ₹)
 * @param {string} [props.suffix=''] - Numeric suffix (e.g. Cr, %)
 * @param {number} [props.decimals=0] - Decimal places
 */
export default function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const end = parseFloat(value);
    if (isNaN(end)) {
      setDisplayValue(value);
      return;
    }

    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    let start = 0;
    const duration = 1200; // 1.2 seconds
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuad
      const easeProgress = progress * (2 - progress);
      const current = start + (end - start) * easeProgress;
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const formatNumber = (num) => {
    if (typeof num === 'string') return num;
    // Format large numbers with commas
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <span>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}

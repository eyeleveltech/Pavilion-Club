'use client';

import React, { forwardRef, useRef, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';

export interface GoldButtonProps {
  children: ReactNode;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  id?: string;
}

export const GoldButton = forwardRef<HTMLElement, GoldButtonProps>(function GoldButton(
  {
    href,
    children,
    fullWidth = false,
    className = '',
    type = 'button',
    disabled = false,
    onClick,
    target,
    rel,
    ariaLabel,
    id,
    ...rest
  },
  forwardedRef
) {
  const localRef = useRef<HTMLElement | null>(null);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [forwardedRef]
  );

  // Magnetic cursor follow effect (matching Book Now button physics)
  useEffect(() => {
    const el = localRef.current;
    if (!el || typeof window === 'undefined') return;
    if (disabled) return;

    // Check if mouse / fine pointer device
    if (!window.matchMedia('(pointer: fine)').matches) return;

    (el as any).__hasMagnetic = true;

    // Maximum magnetic displacement (clamped for fullWidth to prevent overflow)
    const maxShiftX = fullWidth ? 14 : 24;
    const maxShiftY = 10;
    const factor = fullWidth ? 0.2 : 0.3;

    const gsap = (window as any).gsap;
    if (gsap && typeof gsap.quickTo === 'function') {
      const bx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const by = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });

      const handleMouseMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const rawX = (e.clientX - (r.left + r.width / 2)) * factor;
        const rawY = (e.clientY - (r.top + r.height / 2)) * factor;
        const clampedX = Math.max(-maxShiftX, Math.min(maxShiftX, rawX));
        const clampedY = Math.max(-maxShiftY, Math.min(maxShiftY, rawY));
        bx(clampedX);
        by(clampedY);
      };

      const handleMouseLeave = () => {
        bx(0);
        by(0);
      };

      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseleave', handleMouseLeave);
        try {
          gsap.set(el, { clearProps: 'x,y' });
        } catch {
          // ignore cleanup error if unmounted
        }
      };
    } else {
      // Fluid spring lerp fallback when GSAP is not yet in global scope
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;
      let rafId: number | null = null;
      let isHovered = false;

      const lerp = () => {
        currentX += (targetX - currentX) * 0.16;
        currentY += (targetY - currentY) * 0.16;
        el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

        if (isHovered || Math.abs(currentX) > 0.05 || Math.abs(currentY) > 0.05) {
          rafId = requestAnimationFrame(lerp);
        } else {
          el.style.transform = '';
          rafId = null;
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        isHovered = true;
        const r = el.getBoundingClientRect();
        const rawX = (e.clientX - (r.left + r.width / 2)) * factor;
        const rawY = (e.clientY - (r.top + r.height / 2)) * factor;
        targetX = Math.max(-maxShiftX, Math.min(maxShiftX, rawX));
        targetY = Math.max(-maxShiftY, Math.min(maxShiftY, rawY));

        if (!rafId) {
          rafId = requestAnimationFrame(lerp);
        }
      };

      const handleMouseLeave = () => {
        isHovered = false;
        targetX = 0;
        targetY = 0;
        if (!rafId) {
          rafId = requestAnimationFrame(lerp);
        }
      };

      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseleave', handleMouseLeave);
        if (rafId) cancelAnimationFrame(rafId);
        el.style.transform = '';
      };
    }
  }, [fullWidth, disabled]);

  const combinedClasses = [
    'editorial-btn',
    fullWidth ? 'w-full !flex' : '',
    disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <span className="relative z-[2] inline-flex items-center justify-center gap-2 pointer-events-none w-full">
      {children}
    </span>
  );

  if (href) {
    const isExternal = href.startsWith('http') || href.startsWith('//');
    const isJump = href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:');

    if (isExternal || isJump) {
      return (
        <a
          ref={setRef as React.Ref<HTMLAnchorElement>}
          href={href}
          {...(id ? { id } : {})}
          {...(isExternal ? { target: target || '_blank', rel: rel || 'noopener noreferrer' } : target ? { target } : {})}
          {...(rel && !isExternal ? { rel } : {})}
          {...(onClick ? { onClick: onClick as any } : {})}
          className={combinedClasses}
          {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
          {...rest}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        ref={setRef as React.Ref<HTMLAnchorElement>}
        href={href}
        {...(id ? { id } : {})}
        {...(target ? { target } : {})}
        {...(rel ? { rel } : {})}
        {...(onClick ? { onClick: onClick as any } : {})}
        className={combinedClasses}
        {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={setRef as React.Ref<HTMLButtonElement>}
      type={type}
      {...(id ? { id } : {})}
      disabled={disabled}
      {...(onClick ? { onClick } : {})}
      className={combinedClasses}
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      {...rest}
    >
      {content}
    </button>
  );
});

'use client';

import React, { forwardRef, type ReactNode } from 'react';
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
  ref
) {
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
          ref={ref as React.Ref<HTMLAnchorElement>}
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
        ref={ref as React.Ref<HTMLAnchorElement>}
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
      ref={ref as React.Ref<HTMLButtonElement>}
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

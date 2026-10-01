'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function GlobalCursor() {
  const pathname = usePathname();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [badgeText, setBadgeText] = useState('');
  const [isHover, setIsHover] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Admin desk uses native system pointer
    if (pathname && pathname.startsWith('/admin')) {
      document.body.classList.remove('has-cursor');
      return;
    }

    const mouse = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let rafId: number;
    let visible = false;

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      if (!visible) {
        visible = true;
        setIsVisible(true);
        document.body.classList.add('has-cursor');
        ringPos.x = e.clientX;
        ringPos.y = e.clientY;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseLeave = () => {
      visible = false;
      setIsVisible(false);
      document.body.classList.remove('has-cursor');
    };

    const onMouseEnter = (e: MouseEvent) => {
      visible = true;
      setIsVisible(true);
      document.body.classList.add('has-cursor');
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      ringPos.x = e.clientX;
      ringPos.y = e.clientY;
    };

    const onTouchStart = () => {
      visible = false;
      setIsVisible(false);
      document.body.classList.remove('has-cursor');
    };

    const loop = () => {
      ringPos.x += (mouse.x - ringPos.x) * 0.18;
      ringPos.y += (mouse.y - ringPos.y) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const onMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'a, button, [data-cursor], .magnetic, .row, [role="button"], input[type="submit"]'
      );
      if (!target) return;

      const dataCursor = (target as HTMLElement).getAttribute('data-cursor');
      if (dataCursor) {
        setIsHover(true);
        setIsLink(false);
        setBadgeText(dataCursor);
      } else {
        setIsLink(true);
        setIsHover(false);
        setBadgeText('');
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'a, button, [data-cursor], .magnetic, .row, [role="button"], input[type="submit"]'
      );
      if (!target) return;
      setIsHover(false);
      setIsLink(false);
      setBadgeText('');
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      window.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.body.classList.remove('has-cursor');
    };
  }, [pathname]);

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <div
        ref={dotRef}
        className="pavilion-cursor-dot"
        style={{
          opacity: isVisible ? 1 : 0,
        }}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className={`pavilion-cursor-ring ${isHover ? 'is-hover' : ''} ${isLink ? 'is-link' : ''}`}
        style={{
          opacity: isVisible ? 1 : 0,
        }}
        aria-hidden="true"
      >
        {isHover ? badgeText : null}
      </div>
    </>
  );
}

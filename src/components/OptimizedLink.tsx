'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  prefetch?: boolean;
  onMouseOver?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseOut?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const OptimizedLink = memo(({ 
  href, 
  children, 
  className,
  style,
  onClick, 
  prefetch = true,
  onMouseOver,
  onMouseOut,
  onMouseEnter,
  onMouseLeave
}: OptimizedLinkProps) => {
  const router = useRouter();

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetch) {
      router.prefetch(href);
    }
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  }, [href, prefetch, router, onMouseEnter]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  return (
    <Link
      href={href}
      className={className}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
});

OptimizedLink.displayName = 'OptimizedLink';

export default OptimizedLink;

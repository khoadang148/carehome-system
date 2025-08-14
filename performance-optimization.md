# Hướng dẫn tối ưu hóa hiệu suất Next.js

## Các thay đổi đã thực hiện

### 1. Tối ưu hóa Next.js Config
- Tắt `reactStrictMode` trong development để giảm re-render
- Tối ưu hóa webpack với source maps nhẹ hơn
- Thêm bundle splitting cho production
- Tối ưu hóa package imports
- Bật SWC minification

### 2. Tối ưu hóa Components
- Sử dụng `memo()` để tránh re-render không cần thiết
- Tối ưu hóa `useMemo` và `useCallback` trong contexts
- Tách các component con thành memoized components

### 3. Tối ưu hóa CSS
- Tối ưu hóa animations và transitions
- Thêm CSS cho reduced motion
- Tối ưu hóa scrollbar
- Cải thiện text rendering

### 4. Tối ưu hóa Context
- Memoize context values
- Tối ưu hóa session checking
- Cải thiện logout flow

## Cách sử dụng

### Development
```bash
# Chạy với turbo mode (nhanh hơn)
npm run dev:turbo

# Chạy bình thường
npm run dev
```

### Production
```bash
# Build với phân tích bundle
npm run build:analyze

# Chạy production
npm run start:prod
```

### Performance Analysis
```bash
# Phân tích bundle size
npm run bundle:analyze

# Kiểm tra performance với Lighthouse
npm run performance:audit

# Xóa cache và restart
npm run cache:clear
```

## Các tối ưu hóa khác có thể thực hiện

### 1. Code Splitting
```typescript
// Lazy load components
const LazyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

### 2. Image Optimization
```typescript
import Image from 'next/image';

// Sử dụng Next.js Image component
<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={true} // Cho images above the fold
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 3. API Route Optimization
```typescript
// Sử dụng caching
export async function GET() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // Cache 1 hour
  });
  return Response.json(await data.json());
}
```

### 4. Database Optimization
```typescript
// Sử dụng connection pooling
// Implement query caching
// Use database indexes
```

### 5. Bundle Analysis
```bash
# Cài đặt bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Chạy phân tích
npm run bundle:analyze
```

## Monitoring Performance

### 1. Core Web Vitals
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

### 2. Bundle Size
- JavaScript: < 200KB (gzipped)
- CSS: < 50KB (gzipped)
- Images: < 1MB total

### 3. Loading Times
- First Paint: < 1s
- Time to Interactive: < 3s
- Page Load: < 5s

## Troubleshooting

### Nếu vẫn còn lag:
1. Kiểm tra bundle size: `npm run bundle:analyze`
2. Kiểm tra network requests trong DevTools
3. Sử dụng React DevTools Profiler
4. Kiểm tra memory leaks
5. Tối ưu hóa database queries

### Common Issues:
- Large bundle size: Sử dụng dynamic imports
- Memory leaks: Kiểm tra useEffect cleanup
- Slow API calls: Implement caching
- Heavy computations: Sử dụng Web Workers

## Best Practices

1. **Lazy Loading**: Load components khi cần
2. **Memoization**: Sử dụng React.memo, useMemo, useCallback
3. **Code Splitting**: Chia nhỏ bundle
4. **Image Optimization**: Sử dụng Next.js Image
5. **Caching**: Implement proper caching strategies
6. **Monitoring**: Theo dõi performance metrics

# Vercel Deployment Guide

## 🚨 **Lỗi Vercel thường gặp**

### Lỗi Function
- `FUNCTION_INVOCATION_FAILED` (500) - Function execution failed
- `FUNCTION_INVOCATION_TIMEOUT` (504) - Function timeout
- `FUNCTION_THROTTLED` (503) - Too many requests

### Lỗi Deployment
- `DEPLOYMENT_BLOCKED` (403) - Deployment blocked
- `DEPLOYMENT_NOT_FOUND` (404) - Deployment not found

## 🔧 **Khắc phục từng bước**

### 1. **Kiểm tra trước khi deploy**

```bash
# Chạy script kiểm tra
npm run deploy:check

# Test build locally
npm run build

# Test start locally
npm run start
```

### 2. **Cấu hình Vercel**

#### A. Tạo file `vercel.json` (đã tạo)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### B. Environment Variables trong Vercel Dashboard
```
NEXT_PUBLIC_API_URL=https://sep490-be-xniz.onrender.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 3. **Deploy với Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 4. **Deploy với script tự động**

```bash
# Chạy script deploy
npm run deploy:vercel
```

## 🛠️ **Troubleshooting**

### Lỗi Build
```bash
# Clean và rebuild
rm -rf .next out
npm run build

# Check build size
npm run deploy:check
```

### Lỗi Function Timeout
1. Kiểm tra `vercel.json` có `maxDuration: 30`
2. Tối ưu API calls trong code
3. Sử dụng caching cho API calls

### Lỗi Memory/Size
1. Kiểm tra bundle size: `npm run analyze`
2. Tối ưu imports: chỉ import cần thiết
3. Sử dụng dynamic imports cho large components

### Lỗi Environment Variables
1. Kiểm tra trong Vercel Dashboard
2. Đảm bảo tên biến đúng
3. Restart deployment sau khi thay đổi env vars

## 📊 **Monitoring**

### 1. **Vercel Dashboard**
- Functions tab: xem function logs
- Analytics tab: xem performance
- Settings tab: xem environment variables

### 2. **Console Logs**
```bash
# Xem logs real-time
vercel logs --follow

# Xem logs của function cụ thể
vercel logs --function=api/example
```

### 3. **Performance Monitoring**
```bash
# Chạy performance test
npm run performance:test

# Analyze bundle
npm run analyze
```

## 🚀 **Best Practices**

### 1. **Code Optimization**
```typescript
// ✅ Good: Dynamic import
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
});

// ❌ Bad: Static import
import HeavyComponent from './HeavyComponent';
```

### 2. **API Optimization**
```typescript
// ✅ Good: Caching
const cachedData = useSWR('key', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 30000
});

// ❌ Bad: No caching
useEffect(() => {
  fetchData();
}, []);
```

### 3. **Error Handling**
```typescript
// ✅ Good: Silent error handling
try {
  const data = await api.getData();
  return data;
} catch (error) {
  // Silent fail - don't crash the app
  return defaultValue;
}

// ❌ Bad: Throwing errors
try {
  const data = await api.getData();
  return data;
} catch (error) {
  throw error; // This can crash the app
}
```

## 🔍 **Debug Commands**

```bash
# Check deployment status
vercel ls

# View deployment details
vercel inspect [deployment-url]

# Check function logs
vercel logs [function-name]

# Test locally with Vercel
vercel dev
```

## 📝 **Checklist trước khi deploy**

- [ ] `npm run build` thành công
- [ ] `npm run start` hoạt động
- [ ] Environment variables đã set
- [ ] API endpoints accessible
- [ ] Bundle size < 100MB
- [ ] No console errors
- [ ] All tests pass

## 🆘 **Khi gặp lỗi**

1. **Check Vercel Dashboard** - xem error logs
2. **Run local tests** - `npm run test:all`
3. **Check build locally** - `npm run build`
4. **Review code changes** - git diff
5. **Contact support** - nếu vẫn không fix được

## 📞 **Support**

- Vercel Docs: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions
- Project Issues: Tạo issue trong repo

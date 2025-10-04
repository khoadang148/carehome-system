# Messages API Troubleshooting Guide

## Vấn đề
Khi deploy, API `/messages/unread-count` có thể gây lỗi và ảnh hưởng đến chức năng đăng ký resident mới.

## Nguyên nhân
1. **API `/messages/unread-count` không ổn định** khi deploy
2. **Error handling không đủ tốt** - lỗi từ messages API có thể ảnh hưởng đến các chức năng khác
3. **Polling quá thường xuyên** - gây tải cho server
4. **Console spam** - quá nhiều warning/error logs

## Giải pháp đã áp dụng

### 1. Cải thiện Error Handling
```typescript
// Trước
catch (error) {
  console.warn('Failed to fetch unread count, using cached value or default:', error);
}

// Sau
catch (error) {
  // Silent error handling - không log warning để tránh spam console
  // Nếu có cache cũ, sử dụng nó
  if (unreadCountCache) {
    return { unreadCount: unreadCountCache.count };
  }
  // Trả về giá trị mặc định
  return { unreadCount: 0 };
}
```

### 2. Giảm Timeout và Retry
```typescript
// Trước
timeout: 10000, // 10s
retry: 1, // 1 lần retry

// Sau  
timeout: 5000, // 5s
retry: 0, // Không retry để tránh delay
```

### 3. Tăng Polling Interval
```typescript
// Trước
setInterval(pollUnreadCounts, 10000); // 10s

// Sau
setInterval(pollUnreadCounts, 15000); // 15s
setInterval(fetchUnreadCount, 20000); // 20s cho các component khác
```

### 4. Cải thiện Cache Strategy
```typescript
// Cache duration: 5 giây
const CACHE_DURATION = 5000;

// Kiểm tra cache trước khi gọi API
if (unreadCountCache && (now - unreadCountCache.timestamp) < CACHE_DURATION) {
  return { unreadCount: unreadCountCache.count };
}
```

## Files đã được sửa

1. **`src/lib/api.ts`**
   - Cải thiện `messagesAPI.getUnreadCount()`
   - Giảm timeout và retry
   - Silent error handling

2. **`src/lib/contexts/chat-provider.tsx`**
   - Tăng polling interval
   - Cải thiện error handling
   - Chỉ poll khi user đã đăng nhập

3. **`src/components/ChatFloatingButton.tsx`**
   - Silent error handling
   - Tăng polling interval

4. **`src/components/ChatButton.tsx`**
   - Tăng polling interval

5. **`src/components/StaffChatButton.tsx`**
   - Tăng polling interval

## Test Scripts

### Test Messages API
```bash
npm run test:messages-api
```

### Test Resident Registration
```bash
npm run test:resident-registration
```

## Kết quả mong đợi

1. **Messages API failures không ảnh hưởng** đến chức năng đăng ký resident
2. **Console sạch hơn** - không còn spam warning/error logs
3. **Performance tốt hơn** - ít API calls hơn
4. **Error isolation** - lỗi từ một API không ảnh hưởng đến API khác

## Monitoring

Để monitor tình trạng API:

1. **Check console logs** - không nên có error spam
2. **Test resident registration** - phải hoạt động bình thường
3. **Check network tab** - messages API calls nên ít hơn
4. **Monitor performance** - app nên chạy mượt hơn

## Fallback Strategy

Nếu messages API hoàn toàn fail:
- App vẫn hoạt động bình thường
- Chat features sẽ không có unread count
- Các chức năng khác không bị ảnh hưởng
- User có thể refresh để thử lại

## Best Practices

1. **Luôn có fallback** cho các API không critical
2. **Silent error handling** cho polling APIs
3. **Cache strategy** để giảm API calls
4. **Error isolation** - lỗi một API không ảnh hưởng API khác
5. **Monitoring** - theo dõi performance và errors

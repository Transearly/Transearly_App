# Kết nối Mobile App với Backend API

## Bước 1: Tìm IP máy tính của bạn

Mở PowerShell và chạy:
```powershell
ipconfig
```

Tìm dòng **IPv4 Address** (ví dụ: `192.168.1.100`)

## Bước 2: Cập nhật API Config

Mở file `src/config/api.config.js` và sửa:
```javascript
export const API_HOST = '192.168.1.100'; // <-- Đổi thành IP của bạn
```

## Bước 3: Khởi động Backend Server

Trong terminal mới:
```powershell
cd d:\Ky8\AIForSE
npm start
```

Backend sẽ chạy ở `http://localhost:3000`

## Bước 4: Khởi động Mobile App

Trong terminal khác:
```powershell
cd d:\Ky8\AIForSE\mobile-app
npx expo start
```

Quét QR code bằng Expo Go

## Bước 5: Test API

- Mở app trên điện thoại
- Thử dịch text hoặc voice
- Kiểm tra logs ở terminal backend

## Troubleshooting

### Lỗi: "Network request failed"
- ✅ Kiểm tra điện thoại và máy tính cùng WiFi
- ✅ Kiểm tra backend đang chạy (`http://localhost:3000/health`)
- ✅ Kiểm tra IP trong `api.config.js` đúng
- ✅ Tắt firewall hoặc cho phép Node.js qua firewall

### Lỗi: "Connection timeout"
- ✅ Ping từ điện thoại đến máy tính
- ✅ Kiểm tra port 3000 không bị chặn
- ✅ Thử dùng tunnel mode: `npx expo start --tunnel`

### Test Backend riêng:
```powershell
# Test health check
curl http://localhost:3000/health

# Test translation
curl -X POST http://localhost:3000/api/translate/text `
  -H "Content-Type: application/json" `
  -d '{"text":"Hello","sourceLang":"en","targetLang":"vi"}'
```

## API Endpoints

- `POST /api/translate/text` - Dịch text
- `POST /api/translate/voice` - Dịch voice (audio file)
- `POST /api/translate/image` - OCR + dịch từ ảnh
- `GET /api/translate/languages` - Danh sách ngôn ngữ hỗ trợ
- `POST /api/translate/detect` - Tự động detect ngôn ngữ

## Environment Variables (Backend)

Tạo file `.env` trong `d:\Ky8\AIForSE\`:
```
PORT=3000
OPENROUTER_API_KEY=your_api_key_here
```

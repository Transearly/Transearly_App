# Hướng dẫn nhanh - Quick Start Guide

## Chạy app ngay (Run immediately)

### Bước 1: Mở terminal tại thư mục mobile-app
\`\`\`powershell
cd d:\Ky8\AIForSE\mobile-app
\`\`\`

### Bước 2: Khởi chạy Expo
\`\`\`powershell
npm start
\`\`\`

### Bước 3: Chọn platform
- Nhấn \`a\` - Chạy trên Android emulator
- Nhấn \`i\` - Chạy trên iOS simulator (chỉ macOS)
- Nhấn \`w\` - Chạy trên web browser
- Quét QR code - Chạy trên điện thoại thật (cần cài Expo Go)

## Cài Expo Go trên điện thoại

### Android
1. Mở Google Play Store
2. Tìm "Expo Go"
3. Cài đặt app
4. Mở Expo Go và quét QR code từ terminal

### iOS
1. Mở App Store
2. Tìm "Expo Go"
3. Cài đặt app
4. Mở Camera app và quét QR code

## Các màn hình có sẵn

1. **Voice Recording** (Home) - Màn hình chính với nút mic
2. **Translation Discovery** - Khám phá các tính năng
3. **Sentence Challenge** - Quiz học từ vựng
4. **Translation Result** - Kết quả dịch từ ảnh
5. **Text Translator** - Dịch văn bản nhanh

## Navigation

- Bottom tab bar để chuyển màn hình
- Nút back ở header để quay lại
- Các nút trong màn hình để navigate đến feature khác

## Troubleshooting

### Port đã được sử dụng?
\`\`\`powershell
npm start -- --port 8082
\`\`\`

### Clear cache nếu có lỗi
\`\`\`powershell
npm start -- --clear
\`\`\`

### Lỗi Metro bundler
\`\`\`powershell
npx react-native start --reset-cache
\`\`\`

## Development Tips

- Hot reload: Nhấn \`r\` trong terminal để reload
- Debug menu trên điện thoại: Shake device hoặc Cmd+D (iOS) / Cmd+M (Android)
- Console logs: Xem trong terminal hoặc browser DevTools

## Next Steps

Sau khi app chạy được, bạn có thể:
1. Tích hợp API dịch thuật thực
2. Thêm database local (AsyncStorage)
3. Implement camera cho text capture
4. Thêm audio recording thực tế
5. Customize theme và colors
6. Add more screens và features

## Liên hệ Support

Nếu gặp vấn đề:
1. Check README.md để biết chi tiết
2. Xem logs trong terminal
3. Google error message + "expo" hoặc "react native"
4. Check Expo docs: https://docs.expo.dev

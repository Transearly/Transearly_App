# Language Translator App - React Native

Ứng dụng dịch thuật đa tính năng được xây dựng bằng React Native và Expo, bao gồm:

## ✨ Tính năng

- 🎤 **Voice Recording**: Ghi âm và dịch giọng nói real-time
- 🔍 **Translation Discovery**: Khám phá các loại dịch thuật (trẻ em, thú cưng)
- 🎯 **Sentence Challenge**: Thử thách sắp xếp câu và học từ vựng
- 📸 **Live Text Capture**: Dịch văn bản từ camera/ảnh
- 📝 **Text Translator**: Dịch văn bản nhanh với nhiều ngôn ngữ

## 🎨 Giao diện

- Gradient màu tươi sáng (blue-green)
- Hiệu ứng animation mượt mà
- Bottom navigation dễ sử dụng
- Card-based design hiện đại
- Icon set phong phú từ Ionicons

## 📱 Screenshots

Ứng dụng bao gồm 5 màn hình chính:
1. Voice Recording - Màn hình ghi âm với nút mic pulse effect
2. Translation Discovery - Khám phá các tính năng dịch đặc biệt
3. Sentence Challenge - Quiz sắp xếp từ thành câu
4. Translation Result - Hiển thị kết quả dịch từ ảnh
5. Text Translator - Dịch văn bản và truy cập nhanh

## 🚀 Cài đặt

### Yêu cầu

- Node.js >= 14
- npm hoặc yarn
- Expo CLI
- Expo Go app (để test trên điện thoại)

### Bước 1: Cài đặt dependencies

```powershell
cd mobile-app
npm install
```

### Bước 2: Chạy ứng dụng

#### Chạy với Expo Go (khuyến nghị cho development)

``` powershell
npm start
```

Quét QR code bằng:
- **iOS**: Mở Camera app và quét QR code
- **Android**: Mở Expo Go app và quét QR code

#### Chạy trên Android emulator

```powershell
npm run android
```

#### Chạy trên iOS simulator (chỉ trên macOS)

```powershell
npm run ios
```

#### Chạy trên web browser

```powershell
npm run web
```

## 📁 Cấu trúc thư mục

```
mobile-app/
├── App.js                          # Entry point chính
├── index.js                        # Root component registration
├── package.json                    # Dependencies
├── app.json                        # Expo configuration
├── babel.config.js                 # Babel config
└── src/
    ├── navigation/
    │   └── AppNavigator.js         # React Navigation setup
    ├── screens/
    │   ├── VoiceRecordingScreen.js
    │   ├── TranslationDiscoveryScreen.js
    │   ├── SentenceChallengeScreen.js
    │   ├── TranslationResultScreen.js
    │   └── TextTranslatorScreen.js
    ├── components/                 # Reusable components (future)
    └── assets/                     # Images, fonts, etc.
```

## 🛠 Technology Stack

- **React Native 0.74.1**: Framework chính
- **Expo ~51.0.0**: Development platform
- **React Navigation 6**: Navigation library
- **Expo Linear Gradient**: Gradient backgrounds
- **Expo Vector Icons**: Icon library
- **React Native Reanimated**: Advanced animations
- **Expo Camera**: Camera access (cho text capture)
- **Expo AV**: Audio recording

## 🎯 Navigation Flow

```
VoiceRecording (Home)
  ├─> TranslationDiscovery
  │     └─> SentenceChallenge
  ├─> TranslationResult
  └─> TextTranslator
```

## 📝 Các bước tiếp theo

### Tích hợp API dịch thuật thực tế:
- Google Cloud Translation API
- OpenAI API cho dịch thuật AI
- Speech-to-Text API

### Thêm features:
- Local storage cho history
- Offline mode
- Multiple language support
- User authentication
- Cloud sync
- Voice playback

### Cải thiện UI/UX:
- Dark mode
- Custom fonts
- More animations
- Haptic feedback
- Loading states

## 🐛 Troubleshooting

### Lỗi "Unable to resolve module"
```powershell
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### Lỗi Expo Go không kết nối
- Đảm bảo máy tính và điện thoại cùng WiFi
- Thử chuyển sang tunnel mode: \`npm start -- --tunnel\`

### Lỗi Android build
```powershell
cd android
./gradlew clean
cd ..
npm run android
```

## 📄 License

MIT License - Free to use for learning and commercial projects

## 👨‍💻 Author

Created with ❤️ using GitHub Copilot

---

**Note**: Đây là prototype UI/UX. Để ứng dụng hoạt động đầy đủ, cần tích hợp:
- Translation API backend
- Speech recognition service
- Camera/OCR integration
- Database cho user data

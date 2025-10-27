// API Configuration
// Change this IP address to match your development setup

// FOR PHYSICAL DEVICE (Expo Go on phone):
// 1. Run 'ipconfig' in PowerShell
// 2. Find your computer's IPv4 Address (e.g., 192.168.1.100)
// 3. Update API_HOST below with that IP
// 4. Make sure your phone and computer are on the same WiFi

// FOR ANDROID EMULATOR:
// Use: http://10.0.2.2:3000

// FOR iOS SIMULATOR:
// Use: http://localhost:3000

export const API_HOST = '192.168.1.100'; // <-- CHANGE THIS to your computer's IP
export const API_PORT = '3000';
export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

export default {
  API_HOST,
  API_PORT,
  API_BASE_URL,
};

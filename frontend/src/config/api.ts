import { Platform } from 'react-native';

// Default API URL:
// - On Web / Local emulator: http://localhost:3024/api
// - On Physical device (Expo Go): replace with your local WiFi IP or the university server IP (http://119.59.102.161:3024/api)
export const DEFAULT_API_BASE_URL = 
  Platform.OS === 'web' 
    ? 'http://localhost:3024/api' 
    : 'http://119.59.102.161:3024/api';

let currentApiUrl = DEFAULT_API_BASE_URL;

export const getApiBaseUrl = () => currentApiUrl;
export const setApiBaseUrl = (url: string) => {
  currentApiUrl = url;
};

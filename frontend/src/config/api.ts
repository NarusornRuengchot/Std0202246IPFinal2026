// Default API URL: points to the university VPS server where backend is deployed
export const DEFAULT_API_BASE_URL = 'http://119.59.102.161:3024/api';

let currentApiUrl = DEFAULT_API_BASE_URL;

export const getApiBaseUrl = () => currentApiUrl;
export const setApiBaseUrl = (url: string) => {
  currentApiUrl = url;
};
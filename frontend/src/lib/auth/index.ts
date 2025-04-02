import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

// Token in HTTP-only Cookies mit maximaler Sicherheitseinstellungen speichern
export const setTokens = (accessToken: string, refreshToken: string) => {
  // Access Token mit kurzer Lebensdauer (z.B. 15 Minuten)
  Cookies.set('access_token', accessToken, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: 1/96  // 15 Minuten in Tagen
  });
  
  // Refresh Token mit längerer Lebensdauer
  Cookies.set('refresh_token', refreshToken, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: 7  // 7 Tage
  });
};

export const getAccessToken = () => Cookies.get('access_token');
export const getRefreshToken = () => Cookies.get('refresh_token');

export const clearTokens = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
};

export const isTokenValid = (token: string | undefined) => {
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // @ts-ignore - exp property is common in JWT tokens
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export interface DecodedToken {
  sub: number;
  name: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export const getUserFromToken = (token: string | undefined): { 
  id: number; 
  name: string; 
  email: string; 
  role: string; 
} | null => {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
};

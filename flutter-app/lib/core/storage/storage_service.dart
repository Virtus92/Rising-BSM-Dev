import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/models/auth_model.dart';

/// Storage service for securely storing authentication tokens and other data
class StorageService {
  // Key constants for storage
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _tokenExpiryKey = 'token_expiry';
  static const String _userIdKey = 'user_id';
  static const String _userKey = 'user';
  static const String _onboardingCompleteKey = 'onboarding_complete';
  static const String _darkModeKey = 'dark_mode';
  static const String _languageKey = 'language';
  
  // Storage instances
  final FlutterSecureStorage _secureStorage;
  late SharedPreferences _preferences;
  
  // Flag to indicate if storage is initialized
  bool _initialized = false;
  
  StorageService({FlutterSecureStorage? secureStorage}) 
      : _secureStorage = secureStorage ?? const FlutterSecureStorage();
  
  /// Initialize the storage service
  Future<void> init() async {
    if (_initialized) return;
    
    _preferences = await SharedPreferences.getInstance();
    _initialized = true;
  }

  /// Store authentication tokens
  Future<void> storeTokens(AuthTokens tokens) async {
    await _checkInitialized();
    
    await _secureStorage.write(key: _accessTokenKey, value: tokens.accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: tokens.refreshToken);
    
    final expiryDate = DateTime.now().add(Duration(seconds: tokens.expiresIn));
    await _secureStorage.write(
      key: _tokenExpiryKey, 
      value: expiryDate.toIso8601String(),
    );
  }

  /// Get stored access token
  Future<String?> getAccessToken() async {
    await _checkInitialized();
    return _secureStorage.read(key: _accessTokenKey);
  }

  /// Get stored refresh token
  Future<String?> getRefreshToken() async {
    await _checkInitialized();
    return _secureStorage.read(key: _refreshTokenKey);
  }

  /// Get access token expiry date
  Future<DateTime?> getTokenExpiry() async {
    await _checkInitialized();
    
    final expiryString = await _secureStorage.read(key: _tokenExpiryKey);
    if (expiryString == null) {
      return null;
    }
    
    return DateTime.parse(expiryString);
  }
  
  /// Check if access token is expired
  Future<bool> isTokenExpired() async {
    await _checkInitialized();
    
    final expiry = await getTokenExpiry();
    if (expiry == null) {
      return true;
    }
    
    // Consider token expired if it's about to expire in the next 5 minutes
    return DateTime.now().isAfter(
      expiry.subtract(const Duration(minutes: 5)),
    );
  }

  /// Clear authentication data (on logout)
  Future<void> clearAuthData() async {
    await _checkInitialized();
    
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _tokenExpiryKey);
    await _secureStorage.delete(key: _userIdKey);
    await _preferences.remove(_userKey);
  }
  
  /// Store user ID
  Future<void> storeUserId(int userId) async {
    await _checkInitialized();
    await _secureStorage.write(key: _userIdKey, value: userId.toString());
  }
  
  /// Get stored user ID
  Future<int?> getUserId() async {
    await _checkInitialized();
    
    final userIdStr = await _secureStorage.read(key: _userIdKey);
    if (userIdStr == null) {
      return null;
    }
    
    return int.parse(userIdStr);
  }
  
  /// Store user data
  Future<void> storeUserData(Map<String, dynamic> userData) async {
    await _checkInitialized();
    await _preferences.setString(_userKey, jsonEncode(userData));
  }
  
  /// Get stored user data
  Future<Map<String, dynamic>?> getUserData() async {
    await _checkInitialized();
    
    final userDataStr = _preferences.getString(_userKey);
    if (userDataStr == null) {
      return null;
    }
    
    return jsonDecode(userDataStr) as Map<String, dynamic>;
  }
  
  // App preferences
  
  /// Set onboarding complete status
  Future<void> setOnboardingComplete(bool complete) async {
    await _checkInitialized();
    await _preferences.setBool(_onboardingCompleteKey, complete);
  }
  
  /// Check if onboarding is complete
  bool isOnboardingComplete() {
    return _preferences.getBool(_onboardingCompleteKey) ?? false;
  }
  
  /// Set dark mode status
  Future<void> setDarkMode(bool enabled) async {
    await _checkInitialized();
    await _preferences.setBool(_darkModeKey, enabled);
  }
  
  /// Get dark mode status
  bool isDarkMode() {
    return _preferences.getBool(_darkModeKey) ?? false;
  }
  
  /// Set app language
  Future<void> setLanguage(String language) async {
    await _checkInitialized();
    await _preferences.setString(_languageKey, language);
  }
  
  /// Get app language
  String getLanguage() {
    return _preferences.getString(_languageKey) ?? 'en';
  }
  
  /// Check if storage is initialized and initialize if needed
  Future<void> _checkInitialized() async {
    if (!_initialized) {
      await init();
    }
  }
}

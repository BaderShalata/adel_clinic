import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  final _secureStorage = const FlutterSecureStorage();
  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Secure storage for tokens
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: 'auth_token');
  }

  Future<void> deleteToken() async {
    await _secureStorage.delete(key: 'auth_token');
  }

  // Secure credential storage for biometric login
  Future<void> saveCredentials(String email, String password) async {
    await _secureStorage.write(key: 'saved_email', value: email);
    await _secureStorage.write(key: 'saved_password', value: password);
  }

  Future<Map<String, String>?> getCredentials() async {
    final email = await _secureStorage.read(key: 'saved_email');
    final password = await _secureStorage.read(key: 'saved_password');
    if (email != null && password != null) {
      return {'email': email, 'password': password};
    }
    return null;
  }

  Future<bool> hasCredentials() async {
    final email = await _secureStorage.read(key: 'saved_email');
    return email != null;
  }

  Future<void> deleteCredentials() async {
    await _secureStorage.delete(key: 'saved_email');
    await _secureStorage.delete(key: 'saved_password');
  }

  // Regular storage
  Future<void> saveString(String key, String value) async {
    await _prefs?.setString(key, value);
  }

  Future<void> setString(String key, String value) async {
    await _prefs?.setString(key, value);
  }

  String? getString(String key) {
    return _prefs?.getString(key);
  }

  Future<void> remove(String key) async {
    await _prefs?.remove(key);
  }

  Future<void> clear() async {
    // Preserve saved credentials and language preference across sign-outs
    final credentials = await getCredentials();
    final language = getString('language');

    await _prefs?.clear();
    await _secureStorage.deleteAll();

    // Restore preserved data
    if (credentials != null) {
      await saveCredentials(credentials['email']!, credentials['password']!);
    }
    if (language != null) {
      await _prefs?.setString('language', language);
    }
  }
}

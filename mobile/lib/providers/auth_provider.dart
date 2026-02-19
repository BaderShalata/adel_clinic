import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();

  AppUser? _user;
  bool _isLoading = false;
  String? _errorKey; // Translation key for the error

  AppUser? get user => _user;
  bool get isLoading => _isLoading;
  /// Returns the translation key for the error message.
  /// Use LanguageProvider.t(errorKey) to get the translated message.
  String? get errorKey => _errorKey;
  @Deprecated('Use errorKey instead')
  String? get errorMessage => _errorKey;
  bool get isLoggedIn => _authService.isLoggedIn();
  bool get isAdmin => _user?.role == 'admin';
  bool get isDoctor => _user?.role == 'doctor';
  String get userRole => _user?.role ?? 'patient';

  Future<bool> signIn(String email, String password) async {
    _isLoading = true;
    _errorKey = null;
    notifyListeners();

    try {
      _user = await _authService.signInWithEmailPassword(email, password);
      _isLoading = false;
      notifyListeners();
      return true;
    } on AuthException catch (e) {
      _errorKey = e.translationKey;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorKey = 'loginFailed';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String displayName,
    required String phoneNumber,
    required String idNumber,
    required String gender,
  }) async {
    _isLoading = true;
    _errorKey = null;
    notifyListeners();

    try {
      _user = await _authService.registerWithEmailPassword(
        email: email,
        password: password,
        displayName: displayName,
        phoneNumber: phoneNumber,
        idNumber: idNumber,
        gender: gender,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } on AuthException catch (e) {
      _errorKey = e.translationKey;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorKey = 'registrationFailed';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    await _authService.signOut();
    _user = null;
    notifyListeners();
  }

  void clearError() {
    _errorKey = null;
    notifyListeners();
  }
}

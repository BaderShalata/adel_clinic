import 'package:firebase_auth/firebase_auth.dart';
import '../models/user.dart';
import 'api_service.dart' show ApiService, ApiException;
import 'storage_service.dart';

/// Custom exception for authentication errors with a translation key
class AuthException implements Exception {
  final String translationKey;
  final String? details;

  AuthException(this.translationKey, [this.details]);

  @override
  String toString() => translationKey;
}

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;
  final ApiService _apiService = ApiService();
  final StorageService _storage = StorageService();

  User? get currentFirebaseUser => _firebaseAuth.currentUser;
  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

  /// Maps Firebase error codes to translation keys
  String _mapFirebaseErrorToKey(String code) {
    switch (code) {
      case 'user-not-found':
        return 'userNotFound';
      case 'wrong-password':
        return 'wrongPassword';
      case 'invalid-email':
        return 'invalidEmail';
      case 'email-already-in-use':
        return 'emailAlreadyInUse';
      case 'weak-password':
        return 'weakPassword';
      case 'too-many-requests':
        return 'tooManyRequests';
      case 'user-disabled':
        return 'userDisabled';
      case 'network-request-failed':
        return 'networkError';
      case 'operation-not-allowed':
        return 'operationNotAllowed';
      case 'invalid-credential':
        return 'invalidCredential';
      default:
        return 'loginFailed';
    }
  }

  Future<AppUser?> signInWithEmailPassword(
    String email,
    String password,
  ) async {
    try {
      // Sign in with Firebase
      final credential = await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user == null) {
        throw AuthException('loginFailed');
      }

      // Get ID token
      final token = await credential.user!.getIdToken();
      if (token != null) {
        await _storage.saveToken(token);
      }

      // Get user data from backend
      final response = await _apiService.login(email, password);
      return AppUser.fromJson(response);
    } on FirebaseAuthException catch (e) {
      throw AuthException(_mapFirebaseErrorToKey(e.code), e.message);
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('loginFailed', e.toString());
    }
  }

  Future<AppUser?> registerWithEmailPassword({
    required String email,
    required String password,
    required String displayName,
    required String phoneNumber,
    required String idNumber,
    required String gender,
  }) async {
    try {
      // Create Firebase user
      final credential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user == null) {
        throw AuthException('registrationFailed');
      }

      // Update display name
      await credential.user!.updateDisplayName(displayName);

      // Get ID token
      final token = await credential.user!.getIdToken();
      if (token != null) {
        await _storage.saveToken(token);
      }

      // Register in backend
      final response = await _apiService.register(
        email: email,
        password: password,
        displayName: displayName,
        phoneNumber: phoneNumber,
        idNumber: idNumber,
        gender: gender,
      );

      return AppUser.fromJson(response);
    } on FirebaseAuthException catch (e) {
      throw AuthException(_mapFirebaseErrorToKey(e.code), e.message);
    } on ApiException catch (e) {
      // Handle API-specific errors (like ID number already exists)
      throw AuthException(e.translationKey, e.details);
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('registrationFailed', e.toString());
    }
  }

  Future<void> signOut() async {
    await _firebaseAuth.signOut();
    await _storage.clear();
  }

  Future<String?> getIdToken() async {
    final user = _firebaseAuth.currentUser;
    if (user != null) {
      return await user.getIdToken();
    }
    return null;
  }

  bool isLoggedIn() {
    return _firebaseAuth.currentUser != null;
  }

  Future<AppUser?> updateProfile({
    String? displayName,
    String? phoneNumber,
    String? idNumber,
    String? gender,
    String? photoUrl,
  }) async {
    try {
      final user = _firebaseAuth.currentUser;
      if (user == null) {
        throw AuthException('loginFailed');
      }

      // Update Firebase display name if provided
      if (displayName != null && displayName.isNotEmpty) {
        await user.updateDisplayName(displayName);
      }

      // Update Firebase photo URL if provided
      if (photoUrl != null && photoUrl.isNotEmpty) {
        await user.updatePhotoURL(photoUrl);
      }

      // Update profile in backend
      final response = await _apiService.updateProfile(
        displayName: displayName,
        phoneNumber: phoneNumber,
        idNumber: idNumber,
        gender: gender,
        photoUrl: photoUrl,
      );

      return AppUser.fromJson(response);
    } on ApiException catch (e) {
      // Handle API-specific errors (like ID number already exists)
      throw AuthException(e.translationKey, e.details);
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('failedToUpdateProfile', e.toString());
    }
  }
}

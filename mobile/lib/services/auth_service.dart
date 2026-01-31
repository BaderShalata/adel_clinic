import 'package:firebase_auth/firebase_auth.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;
  final ApiService _apiService = ApiService();
  final StorageService _storage = StorageService();

  User? get currentFirebaseUser => _firebaseAuth.currentUser;
  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

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
        throw Exception('Sign in failed');
      }

      // Get ID token
      final token = await credential.user!.getIdToken();
      if (token != null) {
        await _storage.saveToken(token);
      }

      // Get user data from backend
      final response = await _apiService.login(email, password);
      return AppUser.fromJson(response);
    } catch (e) {
      throw Exception('Sign in failed: $e');
    }
  }

  Future<AppUser?> registerWithEmailPassword({
    required String email,
    required String password,
    required String displayName,
    String? phoneNumber,
    String? idNumber,
  }) async {
    try {
      // Create Firebase user
      final credential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user == null) {
        throw Exception('Registration failed');
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
      );

      return AppUser.fromJson(response);
    } catch (e) {
      throw Exception('Registration failed: $e');
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
}

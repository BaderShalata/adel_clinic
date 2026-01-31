import 'package:dio/dio.dart';
import '../constants.dart';
import '../models/doctor.dart';
import '../models/appointment.dart';
import '../models/news.dart';
import 'storage_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late Dio _dio;
  final _storage = StorageService();

  void init() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    // Add interceptor for auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          // Handle 401 errors
          if (error.response?.statusCode == 401) {
            // Token expired or invalid
            _storage.deleteToken();
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Doctor APIs
  Future<List<Doctor>> getDoctors() async {
    try {
      final response = await _dio.get('/doctors');
      return (response.data as List)
          .map((json) => Doctor.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Failed to load doctors: $e');
    }
  }

  Future<Doctor> getDoctorById(String id) async {
    try {
      final response = await _dio.get('/doctors/$id');
      return Doctor.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      throw Exception('Failed to load doctor: $e');
    }
  }

  Future<Map<String, dynamic>> getDoctorSchedule(String id, int dayOfWeek) async {
    try {
      final response = await _dio.get(
        '/doctors/$id/schedule/slots',
        queryParameters: {'dayOfWeek': dayOfWeek},
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to load schedule: $e');
    }
  }

  Future<Map<String, dynamic>> getDoctorWeeklySchedule(String id) async {
    try {
      final response = await _dio.get('/doctors/$id/schedule/weekly');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to load weekly schedule: $e');
    }
  }

  // Appointment APIs
  Future<Appointment> createAppointment(Appointment appointment) async {
    try {
      final response = await _dio.post(
        '/appointments',
        data: appointment.toJson(),
      );
      return Appointment.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      throw Exception('Failed to create appointment: $e');
    }
  }

  Future<List<Appointment>> getMyAppointments() async {
    try {
      final response = await _dio.get('/appointments');
      return (response.data as List)
          .map((json) => Appointment.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Failed to load appointments: $e');
    }
  }

  // Auth APIs
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to login: $e');
    }
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String displayName,
    String? phoneNumber,
    String? idNumber,
  }) async {
    try {
      print('DEBUG: Calling register API');
      print('DEBUG: Base URL: ${_dio.options.baseUrl}');
      final response = await _dio.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'displayName': displayName,
          if (phoneNumber != null) 'phoneNumber': phoneNumber,
          if (idNumber != null) 'idNumber': idNumber,
          'role': 'patient',
        },
      );
      print('DEBUG: Register success: ${response.data}');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      print('DEBUG: Register error: $e');
      if (e is DioException && e.response != null) {
        print('DEBUG: Response status: ${e.response?.statusCode}');
        print('DEBUG: Response data: ${e.response?.data}');
      }
      throw Exception('Failed to register: $e');
    }
  }

  // News APIs
  Future<List<News>> getPublishedNews() async {
    try {
      final response = await _dio.get('/news/published');
      return (response.data as List)
          .map((json) => News.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Failed to load news: $e');
    }
  }
}

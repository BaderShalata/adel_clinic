import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../constants.dart';
import '../models/doctor.dart';
import '../models/appointment.dart';
import '../models/news.dart';
import '../models/slot_info.dart';
import '../models/waiting_list.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late Dio _dio;
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;

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

    // Add interceptor for auth token - always get fresh token from Firebase
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final user = _firebaseAuth.currentUser;
          if (user != null) {
            // Always get a fresh token (Firebase caches it if still valid)
            final token = await user.getIdToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          // Log 401 errors for debugging
          if (error.response?.statusCode == 401) {
            print('DEBUG: 401 Unauthorized - Token may be invalid');
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

  Future<List<Doctor>> getDoctorsBySpecialty(String specialty) async {
    try {
      final response = await _dio.get('/doctors/specialty/$specialty');
      return (response.data as List)
          .map((json) => Doctor.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Failed to load doctors by specialty: $e');
    }
  }

  Future<AvailableSlotsResponse> getAvailableSlots(
    String doctorId,
    DateTime date, {
    String? serviceType,
  }) async {
    try {
      final dateStr =
          '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      final queryParams = <String, dynamic>{'date': dateStr};
      if (serviceType != null) {
        queryParams['serviceType'] = serviceType;
      }

      print('DEBUG: Fetching slots for doctor $doctorId on $dateStr, serviceType: $serviceType');

      final response = await _dio.get(
        '/doctors/$doctorId/available-slots',
        queryParameters: queryParams,
      );

      print('DEBUG: Slots response: ${response.data}');

      return AvailableSlotsResponse.fromJson(
          response.data as Map<String, dynamic>);
    } catch (e) {
      print('DEBUG: Failed to load slots: $e');
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to load available slots: $e');
    }
  }

  // Appointment APIs
  Future<Appointment> createAppointment(Appointment appointment) async {
    try {
      final response = await _dio.post(
        '/appointments/book',
        data: appointment.toJson(),
      );
      return Appointment.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to create appointment: $e');
    }
  }

  Future<List<Appointment>> getMyAppointments() async {
    try {
      final response = await _dio.get('/appointments/my');
      return (response.data as List)
          .map((json) => Appointment.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
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
    required String phoneNumber,
    required String idNumber,
    required String gender,
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
          'phoneNumber': phoneNumber,
          'idNumber': idNumber,
          'gender': gender,
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

  // Waiting List APIs
  Future<WaitingListEntry> joinWaitingList({
    required String doctorId,
    required DateTime preferredDate,
    required String serviceType,
    String? notes,
  }) async {
    try {
      final response = await _dio.post(
        '/waiting-list/join',
        data: {
          'doctorId': doctorId,
          'preferredDate': preferredDate.toIso8601String(),
          'serviceType': serviceType,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );
      return WaitingListEntry.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to join waiting list: $e');
    }
  }

  Future<List<WaitingListEntry>> getMyWaitingListEntries() async {
    try {
      final response = await _dio.get('/waiting-list/my');
      return (response.data as List)
          .map((json) => WaitingListEntry.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to load waiting list: $e');
    }
  }
}

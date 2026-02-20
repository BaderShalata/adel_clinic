import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../constants.dart';
import '../models/doctor.dart';
import '../models/appointment.dart';
import '../models/news.dart';
import '../models/slot_info.dart';
import '../models/waiting_list.dart';

/// Custom exception for API errors with a translation key
class ApiException implements Exception {
  final String translationKey;
  final String? details;

  ApiException(this.translationKey, [this.details]);

  @override
  String toString() => translationKey;
}

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

  // Admin APIs
  Future<List<Appointment>> getAllAppointments({DateTime? date, String? status}) async {
    try {
      final queryParams = <String, String>{};
      if (date != null) {
        queryParams['startDate'] = date.toIso8601String().split('T')[0];
        queryParams['endDate'] = date.toIso8601String().split('T')[0];
      }
      if (status != null) {
        queryParams['status'] = status;
      }
      final response = await _dio.get('/appointments', queryParameters: queryParams);
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

  Future<Appointment> updateAppointmentStatus(String appointmentId, String status) async {
    try {
      final response = await _dio.put('/appointments/$appointmentId', data: {'status': status});
      return Appointment.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to update appointment: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getAllPatients() async {
    try {
      final response = await _dio.get('/patients');
      return (response.data as List).cast<Map<String, dynamic>>();
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to load patients: $e');
    }
  }

  Future<Appointment> cancelAppointment(String appointmentId) async {
    try {
      print('DEBUG: Cancelling appointment with ID: "$appointmentId"');
      print('DEBUG: Full URL: ${_dio.options.baseUrl}/appointments/my/$appointmentId/cancel');
      final response = await _dio.put('/appointments/my/$appointmentId/cancel');
      return Appointment.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      print('DEBUG: Cancel appointment error: $e');
      if (e is DioException && e.response?.data != null) {
        print('DEBUG: Response status: ${e.response?.statusCode}');
        print('DEBUG: Response data: ${e.response?.data}');
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to cancel appointment: $e');
    }
  }

  // Delete a past/cancelled appointment
  Future<void> deleteMyAppointment(String appointmentId) async {
    try {
      await _dio.delete('/appointments/my/$appointmentId');
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to delete appointment: $e');
    }
  }

  // Clear all past/cancelled appointments from history
  Future<int> clearMyHistory() async {
    try {
      final response = await _dio.delete('/appointments/my/clear-history');
      return response.data['deletedCount'] as int? ?? 0;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to clear history: $e');
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
        final errorData = e.response!.data;
        if (errorData is Map) {
          // Check for ID number already exists error
          if (errorData['errorKey'] == 'idNumberAlreadyExists' ||
              errorData['error'] == 'ID_NUMBER_EXISTS') {
            throw ApiException('idNumberAlreadyExists');
          }
        }
      }
      throw Exception('Failed to register: $e');
    }
  }

  Future<Map<String, dynamic>> updateProfile({
    String? displayName,
    String? phoneNumber,
    String? idNumber,
    String? gender,
    String? photoUrl,
  }) async {
    try {
      final response = await _dio.put(
        '/auth/profile',
        data: {
          if (displayName != null) 'displayName': displayName,
          if (phoneNumber != null) 'phoneNumber': phoneNumber,
          if (idNumber != null) 'idNumber': idNumber,
          if (gender != null) 'gender': gender,
          if (photoUrl != null) 'photoUrl': photoUrl,
        },
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      if (e is DioException && e.response != null) {
        final errorData = e.response!.data;
        if (errorData is Map) {
          // Check for ID number already exists error
          if (errorData['errorKey'] == 'idNumberAlreadyExists' ||
              errorData['error'] == 'ID_NUMBER_EXISTS') {
            throw ApiException('idNumberAlreadyExists');
          }
        }
      }
      throw Exception('Failed to update profile: $e');
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

  // Admin: Get all news (including unpublished)
  Future<List<News>> getAllNews() async {
    try {
      final response = await _dio.get('/news');
      return (response.data as List)
          .map((json) => News.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to load news: $e');
    }
  }

  // Admin: Create news
  Future<News> createNews({
    required String title,
    required String content,
    required String category,
    String? imageURL,
    bool isPublished = false,
  }) async {
    try {
      final response = await _dio.post(
        '/news',
        data: {
          'title': title,
          'content': content,
          'category': category,
          if (imageURL != null && imageURL.isNotEmpty) 'imageURL': imageURL,
          'isPublished': isPublished,
        },
      );
      return News.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to create news: $e');
    }
  }

  // Admin: Update news
  Future<News> updateNews({
    required String newsId,
    String? title,
    String? content,
    String? category,
    String? imageURL,
    bool? isPublished,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (title != null) data['title'] = title;
      if (content != null) data['content'] = content;
      if (category != null) data['category'] = category;
      if (imageURL != null) data['imageURL'] = imageURL;
      if (isPublished != null) data['isPublished'] = isPublished;

      final response = await _dio.put('/news/$newsId', data: data);
      return News.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to update news: $e');
    }
  }

  // Admin: Delete news
  Future<void> deleteNews(String newsId) async {
    try {
      await _dio.delete('/news/$newsId');
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to delete news: $e');
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

  // Admin: Create appointment (bypasses patient ownership check)
  Future<Appointment> adminCreateAppointment({
    required String patientId,
    required String doctorId,
    required DateTime appointmentDate,
    required String appointmentTime,
    required String serviceType,
    String? notes,
  }) async {
    try {
      final response = await _dio.post(
        '/appointments',
        data: {
          'patientId': patientId,
          'doctorId': doctorId,
          'appointmentDate': appointmentDate.toIso8601String(),
          'appointmentTime': appointmentTime,
          'serviceType': serviceType,
          'duration': 15,
          'status': 'scheduled',
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
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

  // Admin: Create patient
  Future<Map<String, dynamic>> createPatient({
    required String fullName,
    String? phoneNumber,
    String? idNumber,
    String? email,
    DateTime? dateOfBirth,
    String? gender,
    String? address,
  }) async {
    try {
      final response = await _dio.post(
        '/patients',
        data: {
          'fullName': fullName,
          if (phoneNumber != null && phoneNumber.isNotEmpty) 'phoneNumber': phoneNumber,
          if (idNumber != null && idNumber.isNotEmpty) 'idNumber': idNumber,
          if (email != null && email.isNotEmpty) 'email': email,
          'dateOfBirth': (dateOfBirth ?? DateTime(2000, 1, 1)).toIso8601String(),
          'gender': gender ?? 'other',
          if (address != null && address.isNotEmpty) 'address': address,
        },
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to create patient: $e');
    }
  }

  // Admin: Lock a time slot
  Future<Map<String, dynamic>> lockSlot({
    required String doctorId,
    required String date,
    required String time,
    String? reason,
  }) async {
    try {
      final response = await _dio.post(
        '/locked-slots',
        data: {
          'doctorId': doctorId,
          'date': date,
          'time': time,
          if (reason != null) 'reason': reason,
        },
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to lock slot: $e');
    }
  }

  // Admin: Unlock a time slot
  Future<void> unlockSlot({
    required String doctorId,
    required String date,
    required String time,
  }) async {
    try {
      await _dio.delete('/locked-slots/doctor/$doctorId/date/$date/time/$time');
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to unlock slot: $e');
    }
  }

  // Admin: Get analytics
  Future<Map<String, dynamic>> getAnalytics() async {
    try {
      final response = await _dio.get('/analytics/dashboard');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to load analytics: $e');
    }
  }

  // Admin: Get all waiting list entries
  Future<List<WaitingListEntry>> getAllWaitingList() async {
    try {
      final response = await _dio.get('/waiting-list');
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

  // Admin: Update waiting list entry status
  Future<WaitingListEntry> updateWaitingListEntry({
    required String entryId,
    String? status,
    int? priority,
    String? notes,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (status != null) data['status'] = status;
      if (priority != null) data['priority'] = priority;
      if (notes != null) data['notes'] = notes;

      final response = await _dio.put('/waiting-list/$entryId', data: data);
      return WaitingListEntry.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to update waiting list entry: $e');
    }
  }

  // Admin: Delete waiting list entry
  Future<void> deleteWaitingListEntry(String entryId) async {
    try {
      await _dio.delete('/waiting-list/$entryId');
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to delete waiting list entry: $e');
    }
  }

  // Admin: Book appointment from waiting list
  Future<void> bookFromWaitingList({
    required String entryId,
    required DateTime appointmentDate,
    required String appointmentTime,
  }) async {
    try {
      await _dio.post('/waiting-list/$entryId/book', data: {
        'appointmentDate': appointmentDate.toIso8601String(),
        'appointmentTime': appointmentTime,
      });
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to book from waiting list: $e');
    }
  }

  // Admin: Create a new doctor
  Future<Doctor> createDoctor({
    required String userId,
    required String fullName,
    String? fullNameEn,
    String? fullNameHe,
    required List<String> specialties,
    List<String>? specialtiesEn,
    List<String>? specialtiesHe,
    required List<String> qualifications,
    List<String>? qualificationsEn,
    List<String>? qualificationsHe,
    String? bio,
    String? bioEn,
    String? bioHe,
    String? imageUrl,
    required List<Map<String, dynamic>> schedule,
  }) async {
    try {
      final response = await _dio.post(
        '/doctors',
        data: {
          'userId': userId,
          'fullName': fullName,
          if (fullNameEn != null) 'fullNameEn': fullNameEn,
          if (fullNameHe != null) 'fullNameHe': fullNameHe,
          'specialties': specialties,
          if (specialtiesEn != null) 'specialtiesEn': specialtiesEn,
          if (specialtiesHe != null) 'specialtiesHe': specialtiesHe,
          'qualifications': qualifications,
          if (qualificationsEn != null) 'qualificationsEn': qualificationsEn,
          if (qualificationsHe != null) 'qualificationsHe': qualificationsHe,
          if (bio != null) 'bio': bio,
          if (bioEn != null) 'bioEn': bioEn,
          if (bioHe != null) 'bioHe': bioHe,
          if (imageUrl != null) 'imageUrl': imageUrl,
          'schedule': schedule,
        },
      );
      return Doctor.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to create doctor: $e');
    }
  }

  // Admin: Update a doctor
  Future<Doctor> updateDoctor({
    required String doctorId,
    String? fullName,
    String? fullNameEn,
    String? fullNameHe,
    List<String>? specialties,
    List<String>? specialtiesEn,
    List<String>? specialtiesHe,
    List<String>? qualifications,
    List<String>? qualificationsEn,
    List<String>? qualificationsHe,
    String? bio,
    String? bioEn,
    String? bioHe,
    String? imageUrl,
    List<Map<String, dynamic>>? schedule,
    bool? isActive,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (fullName != null) data['fullName'] = fullName;
      if (fullNameEn != null) data['fullNameEn'] = fullNameEn;
      if (fullNameHe != null) data['fullNameHe'] = fullNameHe;
      if (specialties != null) data['specialties'] = specialties;
      if (specialtiesEn != null) data['specialtiesEn'] = specialtiesEn;
      if (specialtiesHe != null) data['specialtiesHe'] = specialtiesHe;
      if (qualifications != null) data['qualifications'] = qualifications;
      if (qualificationsEn != null) data['qualificationsEn'] = qualificationsEn;
      if (qualificationsHe != null) data['qualificationsHe'] = qualificationsHe;
      if (bio != null) data['bio'] = bio;
      if (bioEn != null) data['bioEn'] = bioEn;
      if (bioHe != null) data['bioHe'] = bioHe;
      if (imageUrl != null) data['imageUrl'] = imageUrl;
      if (schedule != null) data['schedule'] = schedule;
      if (isActive != null) data['isActive'] = isActive;

      final response = await _dio.put('/doctors/$doctorId', data: data);
      return Doctor.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to update doctor: $e');
    }
  }

  // Admin: Delete a doctor
  Future<void> deleteDoctor(String doctorId) async {
    try {
      await _dio.delete('/doctors/$doctorId');
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to delete doctor: $e');
    }
  }

  // Admin: Delete a patient
  Future<void> deletePatient(String patientId) async {
    try {
      await _dio.delete('/patients/$patientId');
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to delete patient: $e');
    }
  }

  // Upload image to Firebase Storage
  Future<String> uploadImage({
    required String base64Image,
    required String fileName,
    required String folder,
    String mimeType = 'image/jpeg',
  }) async {
    try {
      final response = await _dio.post(
        '/upload/image',
        data: {
          'image': base64Image,
          'fileName': fileName,
          'folder': folder,
          'mimeType': mimeType,
        },
      );
      return response.data['url'] as String;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final errorData = e.response!.data;
        if (errorData is Map && errorData['error'] != null) {
          throw Exception(errorData['error']);
        }
      }
      throw Exception('Failed to upload image: $e');
    }
  }
}

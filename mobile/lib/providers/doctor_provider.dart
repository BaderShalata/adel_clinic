import 'package:flutter/material.dart';
import '../models/doctor.dart';
import '../services/api_service.dart';

class DoctorProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Doctor> _doctors = [];
  Doctor? _selectedDoctor;
  Map<String, dynamic>? _weeklySchedule;
  Map<String, dynamic>? _daySchedule;
  bool _isLoading = false;
  String? _errorMessage;

  List<Doctor> get doctors => _doctors;
  Doctor? get selectedDoctor => _selectedDoctor;
  Map<String, dynamic>? get weeklySchedule => _weeklySchedule;
  Map<String, dynamic>? get daySchedule => _daySchedule;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadDoctors() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _doctors = await _apiService.getDoctors();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadDoctorDetails(String id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _selectedDoctor = await _apiService.getDoctorById(id);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadWeeklySchedule(String doctorId) async {
    try {
      _weeklySchedule = await _apiService.getDoctorWeeklySchedule(doctorId);
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> loadDaySchedule(String doctorId, int dayOfWeek) async {
    try {
      _daySchedule = await _apiService.getDoctorSchedule(doctorId, dayOfWeek);
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  void clearSelectedDoctor() {
    _selectedDoctor = null;
    _weeklySchedule = null;
    _daySchedule = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

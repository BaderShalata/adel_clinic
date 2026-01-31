import 'package:flutter/material.dart';
import '../models/appointment.dart';
import '../services/api_service.dart';

class AppointmentProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Appointment> _appointments = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Appointment> get appointments => _appointments;

  List<Appointment> get upcomingAppointments => _appointments
      .where((a) => a.appointmentDate.isAfter(DateTime.now()) && a.status != 'cancelled')
      .toList()
    ..sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));

  List<Appointment> get pastAppointments => _appointments
      .where((a) => a.appointmentDate.isBefore(DateTime.now()) || a.status == 'completed')
      .toList()
    ..sort((a, b) => b.appointmentDate.compareTo(a.appointmentDate));

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadAppointments() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _appointments = await _apiService.getMyAppointments();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createAppointment(Appointment appointment) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final newAppointment = await _apiService.createAppointment(appointment);
      _appointments.add(newAppointment);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

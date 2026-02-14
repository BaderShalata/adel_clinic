import 'package:flutter/material.dart';
import '../models/appointment.dart';
import '../services/api_service.dart';

class AppointmentProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Appointment> _appointments = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Appointment> get appointments => _appointments;

  List<Appointment> get upcomingAppointments {
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    return _appointments
        .where((a) {
          final appointmentDay = DateTime(a.appointmentDate.year, a.appointmentDate.month, a.appointmentDate.day);
          // Include today and future dates, exclude cancelled
          return !appointmentDay.isBefore(today) && a.status != 'cancelled';
        })
        .toList()
      ..sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));
  }

  List<Appointment> get pastAppointments {
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    return _appointments
        .where((a) {
          final appointmentDay = DateTime(a.appointmentDate.year, a.appointmentDate.month, a.appointmentDate.day);
          // Past dates, completed, or cancelled status
          return appointmentDay.isBefore(today) || a.status == 'completed' || a.status == 'cancelled';
        })
        .toList()
      ..sort((a, b) => b.appointmentDate.compareTo(a.appointmentDate));
  }

  /// Clear/delete all past appointments permanently
  Future<int> clearPastAppointments() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final deletedCount = await _apiService.clearMyHistory();
      // Reload appointments to reflect the deletion
      await loadAppointments();
      return deletedCount;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return 0;
    }
  }

  /// Delete a single past appointment
  Future<bool> deleteAppointment(String appointmentId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _apiService.deleteMyAppointment(appointmentId);
      _appointments.removeWhere((a) => a.id == appointmentId);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Check if user has an active (scheduled/confirmed/pending) upcoming appointment
  bool get hasActiveAppointment {
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    return _appointments.any((a) {
      final appointmentDay = DateTime(a.appointmentDate.year, a.appointmentDate.month, a.appointmentDate.day);
      final isUpcoming = !appointmentDay.isBefore(today);
      final isActive = a.status == 'scheduled' || a.status == 'confirmed' || a.status == 'pending';
      return isUpcoming && isActive;
    });
  }

  /// Get the active upcoming appointment if exists
  Appointment? get activeAppointment {
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    try {
      return _appointments.firstWhere((a) {
        final appointmentDay = DateTime(a.appointmentDate.year, a.appointmentDate.month, a.appointmentDate.day);
        final isUpcoming = !appointmentDay.isBefore(today);
        final isActive = a.status == 'scheduled' || a.status == 'confirmed' || a.status == 'pending';
        return isUpcoming && isActive;
      });
    } catch (_) {
      return null;
    }
  }

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

  Future<bool> cancelAppointment(String appointmentId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final updatedAppointment = await _apiService.cancelAppointment(appointmentId);
      // Update the appointment in the list
      final index = _appointments.indexWhere((a) => a.id == appointmentId);
      if (index != -1) {
        _appointments[index] = updatedAppointment;
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}

import 'package:flutter/foundation.dart';
import '../models/doctor.dart';
import '../models/slot_info.dart';
import '../models/appointment.dart';
import '../services/api_service.dart';

class BookingProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  // State
  String? _selectedService; // Original API service name
  String? _selectedServiceDisplay; // Localized display name
  Doctor? _selectedDoctor;
  DateTime? _selectedDate;
  String? _selectedTimeSlot;
  List<Doctor> _doctorsForService = [];
  AvailableSlotsResponse? _availableSlots;
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  String? get selectedService => _selectedService;
  String? get selectedServiceDisplay => _selectedServiceDisplay ?? _selectedService;
  Doctor? get selectedDoctor => _selectedDoctor;
  DateTime? get selectedDate => _selectedDate;
  String? get selectedTimeSlot => _selectedTimeSlot;
  List<Doctor> get doctorsForService => _doctorsForService;
  AvailableSlotsResponse? get availableSlots => _availableSlots;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Service name mapping: localized display name -> original API name
  Map<String, String> _serviceDisplayToOriginal = {};

  /// Get the original (API) service name from a display name
  String getOriginalServiceName(String displayName) {
    return _serviceDisplayToOriginal[displayName] ?? displayName;
  }

  /// Get all unique services from doctors, localized by language code
  Future<List<String>> getAllServices({String languageCode = 'ar'}) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final doctors = await _apiService.getDoctors();
      final services = <String>{};
      _serviceDisplayToOriginal = {};

      for (final doctor in doctors) {
        final localizedSpecialties = doctor.getLocalizedSpecialties(languageCode);
        for (int i = 0; i < doctor.specialties.length; i++) {
          final original = doctor.specialties[i];
          final localized = i < localizedSpecialties.length ? localizedSpecialties[i] : original;
          services.add(localized);
          _serviceDisplayToOriginal[localized] = original;
        }
      }

      _isLoading = false;
      notifyListeners();
      return services.toList()..sort();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return [];
    }
  }

  // Select a service and load doctors for it
  Future<void> selectService(String service) async {
    final originalService = getOriginalServiceName(service);
    _selectedServiceDisplay = service;
    _selectedService = originalService;
    _selectedDoctor = null;
    _selectedDate = null;
    _selectedTimeSlot = null;
    _availableSlots = null;
    notifyListeners();

    await loadDoctorsForService(originalService);
  }

  // Load doctors for a specific service/specialty
  Future<void> loadDoctorsForService(String service) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _doctorsForService = await _apiService.getDoctorsBySpecialty(service);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  // Select a doctor
  void selectDoctor(Doctor doctor) {
    _selectedDoctor = doctor;
    _selectedDate = null;
    _selectedTimeSlot = null;
    _availableSlots = null;
    notifyListeners();
  }

  // Select a date and load available slots
  Future<void> selectDate(DateTime date) async {
    _selectedDate = date;
    _selectedTimeSlot = null;
    notifyListeners();

    if (_selectedDoctor != null) {
      await loadAvailableSlots(date);
    }
  }

  // Load available slots for a doctor on a specific date
  Future<void> loadAvailableSlots(DateTime date) async {
    if (_selectedDoctor == null) return;

    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      _availableSlots = await _apiService.getAvailableSlots(
        _selectedDoctor!.id,
        date,
        serviceType: _selectedService,
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  // Select a time slot
  void selectTimeSlot(String timeSlot) {
    _selectedTimeSlot = timeSlot;
    notifyListeners();
  }

  // Book the appointment
  Future<Appointment?> bookAppointment({
    required String patientId,
    String? notes,
  }) async {
    if (_selectedDoctor == null ||
        _selectedDate == null ||
        _selectedTimeSlot == null ||
        _selectedService == null) {
      _errorMessage = 'Please complete all booking steps';
      notifyListeners();
      return null;
    }

    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final appointment = Appointment(
        patientId: patientId,
        doctorId: _selectedDoctor!.id,
        appointmentDate: _selectedDate!,
        appointmentTime: _selectedTimeSlot!,
        serviceType: _selectedService!,
        duration: 15,
        status: 'pending',
        notes: notes,
      );

      final created = await _apiService.createAppointment(appointment);

      _isLoading = false;
      notifyListeners();

      return created;
    } catch (e) {
      _isLoading = false;
      final errStr = e.toString().toLowerCase();
      if (errStr.contains('slot') && errStr.contains('available') ||
          errStr.contains('already booked') ||
          errStr.contains('double booking')) {
        _errorMessage = '__slotTaken__';
      } else {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      }
      notifyListeners();
      return null;
    }
  }

  // Pre-select a doctor (for booking from doctor page)
  void preselectDoctor(Doctor doctor, {String? service}) {
    reset();
    _selectedDoctor = doctor;
    if (service != null) {
      _selectedService = service;
    }
    notifyListeners();
  }

  // Set selected service without loading doctors (used when doctor is preselected)
  void setService(String service) {
    _selectedService = service;
    _selectedDate = null;
    _selectedTimeSlot = null;
    _availableSlots = null;
    notifyListeners();
  }

  // Reset all selections
  void reset() {
    _selectedService = null;
    _selectedServiceDisplay = null;
    _selectedDoctor = null;
    _selectedDate = null;
    _selectedTimeSlot = null;
    _doctorsForService = [];
    _availableSlots = null;
    _errorMessage = null;
    notifyListeners();
  }
}

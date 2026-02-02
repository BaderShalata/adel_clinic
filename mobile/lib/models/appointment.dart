class Appointment {
  final String? id;
  final String patientId;
  final String? patientName;
  final String doctorId;
  final String? doctorName;
  final DateTime appointmentDate;
  final String appointmentTime;
  final String serviceType;
  final int duration;
  final String status;
  final String? notes;

  Appointment({
    this.id,
    required this.patientId,
    this.patientName,
    required this.doctorId,
    this.doctorName,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.serviceType,
    this.duration = 15,
    required this.status,
    this.notes,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    // Handle both ISO string and Firestore timestamp format
    DateTime parseDate(dynamic dateValue) {
      if (dateValue is String) {
        return DateTime.parse(dateValue);
      } else if (dateValue is Map && dateValue['_seconds'] != null) {
        return DateTime.fromMillisecondsSinceEpoch(
          (dateValue['_seconds'] as int) * 1000,
        );
      }
      return DateTime.now();
    }

    return Appointment(
      id: json['id'] as String?,
      patientId: json['patientId'] as String,
      patientName: json['patientName'] as String?,
      doctorId: json['doctorId'] as String,
      doctorName: json['doctorName'] as String?,
      appointmentDate: parseDate(json['appointmentDate']),
      appointmentTime: json['appointmentTime'] as String? ?? '',
      serviceType: json['serviceType'] as String? ?? '',
      duration: json['duration'] as int? ?? 15,
      status: json['status'] as String,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'patientId': patientId,
      'doctorId': doctorId,
      'appointmentDate': appointmentDate.toIso8601String(),
      'appointmentTime': appointmentTime,
      'serviceType': serviceType,
      'duration': duration,
      'status': status,
      if (notes != null) 'notes': notes,
    };
  }
}

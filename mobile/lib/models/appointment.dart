class Appointment {
  final String? id;
  final String patientId;
  final String doctorId;
  final DateTime appointmentDate;
  final String appointmentTime;
  final String status;
  final String? notes;

  Appointment({
    this.id,
    required this.patientId,
    required this.doctorId,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.status,
    this.notes,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String?,
      patientId: json['patientId'] as String,
      doctorId: json['doctorId'] as String,
      appointmentDate: DateTime.parse(json['appointmentDate'] as String),
      appointmentTime: json['appointmentTime'] as String,
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
      'status': status,
      if (notes != null) 'notes': notes,
    };
  }
}

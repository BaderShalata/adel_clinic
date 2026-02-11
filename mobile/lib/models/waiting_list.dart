class WaitingListEntry {
  final String id;
  final String patientId;
  final String? patientName;
  final String doctorId;
  final String? doctorName;
  final String serviceType;
  final DateTime preferredDate;
  final String status;
  final int? priority;
  final String? notes;
  final DateTime? createdAt;

  WaitingListEntry({
    required this.id,
    required this.patientId,
    this.patientName,
    required this.doctorId,
    this.doctorName,
    required this.serviceType,
    required this.preferredDate,
    required this.status,
    this.priority,
    this.notes,
    this.createdAt,
  });

  factory WaitingListEntry.fromJson(Map<String, dynamic> json) {
    return WaitingListEntry(
      id: json['id'] ?? '',
      patientId: json['patientId'] ?? '',
      patientName: json['patientName'],
      doctorId: json['doctorId'] ?? '',
      doctorName: json['doctorName'],
      serviceType: json['serviceType'] ?? '',
      preferredDate: _parseDate(json['preferredDate']),
      status: json['status'] ?? 'waiting',
      priority: json['priority'],
      notes: json['notes'],
      createdAt: json['createdAt'] != null ? _parseDate(json['createdAt']) : null,
    );
  }

  static DateTime _parseDate(dynamic date) {
    if (date == null) return DateTime.now();
    if (date is DateTime) return date;
    if (date is String) return DateTime.parse(date);
    if (date is Map) {
      // Handle Firestore Timestamp format
      if (date['_seconds'] != null) {
        return DateTime.fromMillisecondsSinceEpoch(date['_seconds'] * 1000);
      }
    }
    return DateTime.now();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'patientName': patientName,
      'doctorId': doctorId,
      'doctorName': doctorName,
      'serviceType': serviceType,
      'preferredDate': preferredDate.toIso8601String(),
      'status': status,
      'priority': priority,
      'notes': notes,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

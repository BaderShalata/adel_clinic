class SlotInfo {
  final String time;
  final bool available;

  SlotInfo({
    required this.time,
    required this.available,
  });

  factory SlotInfo.fromJson(Map<String, dynamic> json) {
    return SlotInfo(
      time: json['time'] as String,
      available: json['available'] as bool,
    );
  }
}

class AvailableSlotsResponse {
  final String doctorId;
  final String doctorName;
  final String date;
  final int dayOfWeek;
  final String dayName;
  final String? serviceType;
  final int totalSlots;
  final int availableSlots;
  final int bookedSlots;
  final List<SlotInfo> slots;

  AvailableSlotsResponse({
    required this.doctorId,
    required this.doctorName,
    required this.date,
    required this.dayOfWeek,
    required this.dayName,
    this.serviceType,
    required this.totalSlots,
    required this.availableSlots,
    required this.bookedSlots,
    required this.slots,
  });

  factory AvailableSlotsResponse.fromJson(Map<String, dynamic> json) {
    return AvailableSlotsResponse(
      doctorId: json['doctorId'] as String,
      doctorName: json['doctorName'] as String,
      date: json['date'] as String,
      dayOfWeek: json['dayOfWeek'] as int,
      dayName: json['dayName'] as String,
      serviceType: json['serviceType'] as String?,
      totalSlots: json['totalSlots'] as int? ?? 0,
      availableSlots: json['availableSlots'] as int? ?? 0,
      bookedSlots: json['bookedSlots'] as int? ?? 0,
      slots: (json['slots'] as List?)
              ?.map((s) => SlotInfo.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

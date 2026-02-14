class DoctorSchedule {
  final int dayOfWeek;
  final String startTime;
  final String endTime;
  final int slotDuration;
  final String? type;

  DoctorSchedule({
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.slotDuration,
    this.type,
  });

  factory DoctorSchedule.fromJson(Map<String, dynamic> json) {
    return DoctorSchedule(
      dayOfWeek: json['dayOfWeek'] as int,
      startTime: json['startTime'] as String,
      endTime: json['endTime'] as String,
      slotDuration: json['slotDuration'] as int,
      type: json['type'] as String?,
    );
  }
}

class Doctor {
  final String id;
  final String fullName;
  final String? fullNameEn;
  final String? fullNameHe;
  final List<String> specialties;
  final List<String>? specialtiesEn;
  final List<String>? specialtiesHe;
  final List<String> qualifications;
  final List<String>? qualificationsEn;
  final List<String>? qualificationsHe;
  final String? bio;
  final String? bioEn;
  final String? bioHe;
  final String? imageUrl;
  final List<DoctorSchedule> schedule;
  final bool isActive;

  Doctor({
    required this.id,
    required this.fullName,
    this.fullNameEn,
    this.fullNameHe,
    required this.specialties,
    this.specialtiesEn,
    this.specialtiesHe,
    required this.qualifications,
    this.qualificationsEn,
    this.qualificationsHe,
    this.bio,
    this.bioEn,
    this.bioHe,
    this.imageUrl,
    required this.schedule,
    required this.isActive,
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      fullNameEn: json['fullNameEn'] as String?,
      fullNameHe: json['fullNameHe'] as String?,
      specialties: List<String>.from(json['specialties'] as List),
      specialtiesEn: json['specialtiesEn'] != null
          ? List<String>.from(json['specialtiesEn'] as List)
          : null,
      specialtiesHe: json['specialtiesHe'] != null
          ? List<String>.from(json['specialtiesHe'] as List)
          : null,
      qualifications: List<String>.from(json['qualifications'] as List),
      qualificationsEn: json['qualificationsEn'] != null
          ? List<String>.from(json['qualificationsEn'] as List)
          : null,
      qualificationsHe: json['qualificationsHe'] != null
          ? List<String>.from(json['qualificationsHe'] as List)
          : null,
      bio: json['bio'] as String?,
      bioEn: json['bioEn'] as String?,
      bioHe: json['bioHe'] as String?,
      imageUrl: json['imageUrl'] as String?,
      schedule: (json['schedule'] as List)
          .map((s) => DoctorSchedule.fromJson(s as Map<String, dynamic>))
          .toList(),
      isActive: json['isActive'] as bool,
    );
  }
}

class AppUser {
  final String id;
  final String email;
  final String? displayName;
  final String? phoneNumber;
  final String? idNumber;
  final String? gender;
  final String? photoUrl;
  final String role;

  AppUser({
    required this.id,
    required this.email,
    this.displayName,
    this.phoneNumber,
    this.idNumber,
    this.gender,
    this.photoUrl,
    this.role = 'patient',
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      idNumber: json['idNumber'] as String?,
      gender: json['gender'] as String?,
      photoUrl: json['photoUrl'] as String?,
      role: json['role'] as String? ?? 'patient',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      if (displayName != null) 'displayName': displayName,
      if (phoneNumber != null) 'phoneNumber': phoneNumber,
      if (idNumber != null) 'idNumber': idNumber,
      if (gender != null) 'gender': gender,
      if (photoUrl != null) 'photoUrl': photoUrl,
      'role': role,
    };
  }
}

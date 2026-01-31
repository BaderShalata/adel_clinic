import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';

class DoctorDetailScreen extends StatefulWidget {
  final String doctorId;

  const DoctorDetailScreen({
    super.key,
    required this.doctorId,
  });

  @override
  State<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends State<DoctorDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<DoctorProvider>().loadDoctorDetails(widget.doctorId);
      context.read<DoctorProvider>().loadWeeklySchedule(widget.doctorId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final doctorProvider = context.watch<DoctorProvider>();
    final authProvider = context.watch<AuthProvider>();
    final doctor = doctorProvider.selectedDoctor;

    if (doctorProvider.isLoading || doctor == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Doctor Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(doctor.fullNameEn ?? doctor.fullName),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Doctor Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              color: Colors.blue[50],
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.blue[200],
                    child: Text(
                      doctor.fullName[0].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    doctor.fullNameEn ?? doctor.fullName,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (doctor.fullNameEn != null)
                    Text(
                      doctor.fullName,
                      style: TextStyle(
                        fontSize: 18,
                        color: Colors.grey[700],
                      ),
                      textAlign: TextAlign.center,
                    ),
                ],
              ),
            ),

            // Specialties Section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Specialties',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: doctor.specialties
                        .map(
                          (spec) => Chip(
                            label: Text(spec),
                            backgroundColor: Colors.blue[100],
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),

            const Divider(),

            // Qualifications Section
            if (doctor.qualifications.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Qualifications',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...doctor.qualifications.map(
                      (qual) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle,
                                color: Colors.green, size: 20),
                            const SizedBox(width: 8),
                            Expanded(child: Text(qual)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const Divider(),

            // Schedule Section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Weekly Schedule',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (doctorProvider.weeklySchedule != null)
                    ..._buildWeeklySchedule(
                      doctorProvider.weeklySchedule!['weeklySchedule'] as List,
                    )
                  else
                    const Center(child: CircularProgressIndicator()),
                ],
              ),
            ),

            const SizedBox(height: 16),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton(
          onPressed: () {
            if (!authProvider.isLoggedIn) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Please login to book an appointment'),
                ),
              );
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Appointment booking coming soon!'),
                ),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.all(16),
          ),
          child: const Text(
            'Book Appointment',
            style: TextStyle(fontSize: 16),
          ),
        ),
      ),
    );
  }

  List<Widget> _buildWeeklySchedule(List weeklySchedule) {
    final dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return weeklySchedule.map((day) {
      final dayOfWeek = day['dayOfWeek'] as int;
      final schedules = day['schedules'] as List;

      if (schedules.isEmpty) return const SizedBox.shrink();

      return Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.blue[100],
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    dayNames[dayOfWeek],
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: schedules.map((schedule) {
                    return Text(
                      '${schedule['startTime']} - ${schedule['endTime']}',
                      style: const TextStyle(fontSize: 14),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }
}

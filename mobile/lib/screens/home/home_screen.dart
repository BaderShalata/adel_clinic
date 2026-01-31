import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/doctor_provider.dart';
import '../../models/doctor.dart';
import '../auth/login_screen.dart';
import '../doctors/doctor_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Load doctors when screen loads
    Future.microtask(() {
      context.read<DoctorProvider>().loadDoctors();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final doctorProvider = context.watch<DoctorProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Adel Clinic'),
        actions: [
          if (authProvider.isLoggedIn)
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () async {
                await authProvider.signOut();
                setState(() {});
              },
            )
          else
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              child: const Text('Login', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => doctorProvider.loadDoctors(),
        child: doctorProvider.isLoading
            ? const Center(child: CircularProgressIndicator())
            : doctorProvider.errorMessage != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(doctorProvider.errorMessage!),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => doctorProvider.loadDoctors(),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : doctorProvider.doctors.isEmpty
                    ? const Center(child: Text('No doctors available'))
                    : ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          // Welcome section
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Welcome to Adel Clinic',
                                    style: TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    authProvider.isLoggedIn
                                        ? 'Browse our doctors and book appointments'
                                        : 'Browse our doctors. Login to book appointments.',
                                    style: TextStyle(
                                      color: Colors.grey[600],
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Doctors section
                          const Text(
                            'Our Doctors',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ...doctorProvider.doctors.map(
                            (doctor) => DoctorCard(
                              doctor: doctor,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => DoctorDetailScreen(
                                      doctorId: doctor.id,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
      ),
    );
  }
}

class DoctorCard extends StatelessWidget {
  final Doctor doctor;
  final VoidCallback onTap;

  const DoctorCard({
    super.key,
    required this.doctor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: Colors.blue[100],
                child: Text(
                  doctor.fullName[0].toUpperCase(),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.fullNameEn ?? doctor.fullName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 4,
                      children: doctor.specialties
                          .take(2)
                          .map(
                            (spec) => Chip(
                              label: Text(
                                spec,
                                style: const TextStyle(fontSize: 12),
                              ),
                              visualDensity: VisualDensity.compact,
                              materialTapTargetSize:
                                  MaterialTapTargetSize.shrinkWrap,
                            ),
                          )
                          .toList(),
                    ),
                    if (doctor.qualifications.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          doctor.qualifications.take(2).join(', '),
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}

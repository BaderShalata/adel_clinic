import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/booking_provider.dart';
import '../../theme/app_theme.dart';
import 'doctor_selection_screen.dart';

class ServiceSelectionScreen extends StatefulWidget {
  const ServiceSelectionScreen({super.key});

  @override
  State<ServiceSelectionScreen> createState() => _ServiceSelectionScreenState();
}

class _ServiceSelectionScreenState extends State<ServiceSelectionScreen> {
  List<String> _services = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    final bookingProvider = context.read<BookingProvider>();
    bookingProvider.reset();
    final services = await bookingProvider.getAllServices();
    if (mounted) {
      setState(() {
        _services = services;
        _isLoading = false;
      });
    }
  }

  void _selectService(String service) {
    final bookingProvider = context.read<BookingProvider>();
    bookingProvider.selectService(service);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const DoctorSelectionScreen(),
      ),
    );
  }

  IconData _getServiceIcon(String service) {
    final lowerService = service.toLowerCase();
    if (lowerService.contains('pediatr') || lowerService.contains('child')) {
      return Icons.child_care;
    } else if (lowerService.contains('genet')) {
      return Icons.biotech;
    } else if (lowerService.contains('consult')) {
      return Icons.medical_services;
    } else if (lowerService.contains('cardio') || lowerService.contains('heart')) {
      return Icons.favorite;
    } else if (lowerService.contains('derma') || lowerService.contains('skin')) {
      return Icons.face;
    } else if (lowerService.contains('ortho') || lowerService.contains('bone')) {
      return Icons.accessibility_new;
    } else if (lowerService.contains('neuro') || lowerService.contains('brain')) {
      return Icons.psychology;
    } else if (lowerService.contains('eye') || lowerService.contains('ophthal')) {
      return Icons.visibility;
    }
    return Icons.local_hospital;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Appointment'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _services.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.medical_services_outlined,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: AppTheme.spacingM),
                      Text(
                        'No services available',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                    ],
                  ),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(AppTheme.spacingM),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Select Service',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: AppTheme.spacingXS),
                          Text(
                            'Choose the type of consultation you need',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.grey[600],
                                ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppTheme.spacingM,
                        ),
                        itemCount: _services.length,
                        itemBuilder: (context, index) {
                          final service = _services[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: AppTheme.spacingS),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor:
                                    AppTheme.primaryColor.withValues(alpha: 0.1),
                                child: Icon(
                                  _getServiceIcon(service),
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                              title: Text(
                                service,
                                style: const TextStyle(fontWeight: FontWeight.w500),
                              ),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => _selectService(service),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
    );
  }
}

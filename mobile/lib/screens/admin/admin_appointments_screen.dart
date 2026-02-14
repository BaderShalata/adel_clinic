import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../models/appointment.dart';
import '../../models/doctor.dart';
import '../../models/slot_info.dart';
import '../../theme/app_theme.dart';

class AdminAppointmentsScreen extends StatefulWidget {
  const AdminAppointmentsScreen({super.key});

  @override
  State<AdminAppointmentsScreen> createState() => _AdminAppointmentsScreenState();
}

class _AdminAppointmentsScreenState extends State<AdminAppointmentsScreen> {
  final ApiService _apiService = ApiService();
  List<Appointment> _appointments = [];
  List<Doctor> _doctors = [];
  List<Map<String, dynamic>> _patients = [];
  bool _isLoading = true;
  String? _errorMessage;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadAppointments();
    _loadDoctorsAndPatients();
  }

  Future<void> _loadDoctorsAndPatients() async {
    try {
      final results = await Future.wait([
        _apiService.getDoctors(),
        _apiService.getAllPatients(),
      ]);
      setState(() {
        _doctors = results[0] as List<Doctor>;
        _patients = results[1] as List<Map<String, dynamic>>;
      });
    } catch (e) {
      // Silently fail - we'll show error when user tries to create
    }
  }

  Future<void> _loadAppointments() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final appointments = await _apiService.getAllAppointments(date: _selectedDate);
      setState(() {
        _appointments = appointments;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _updateStatus(Appointment appointment, String newStatus) async {
    try {
      await _apiService.updateAppointmentStatus(appointment.id ?? '', newStatus);
      _loadAppointments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Appointment ${newStatus == 'scheduled' ? 'confirmed' : newStatus}'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _showCreateAppointmentDialog() {
    Doctor? selectedDoctor;
    Map<String, dynamic>? selectedPatient;
    DateTime appointmentDate = _selectedDate;
    String? selectedTime;
    String? selectedService;
    List<SlotInfo> availableSlots = [];
    bool loadingSlots = false;
    bool isNewPatient = false;
    final newPatientNameController = TextEditingController();
    final newPatientPhoneController = TextEditingController();
    final notesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          Future<void> loadSlots() async {
            if (selectedDoctor == null) return;
            setModalState(() {
              loadingSlots = true;
              availableSlots = [];
              selectedTime = null;
            });
            try {
              final response = await _apiService.getAvailableSlots(
                selectedDoctor!.id,
                appointmentDate,
                serviceType: selectedService,
              );
              setModalState(() {
                availableSlots = response.slots;
                loadingSlots = false;
              });
            } catch (e) {
              setModalState(() {
                loadingSlots = false;
              });
            }
          }

          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              left: 16,
              right: 16,
              top: 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'New Appointment',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Patient selection
                  Row(
                    children: [
                      const Text('Patient: ', style: TextStyle(fontWeight: FontWeight.w600)),
                      const Spacer(),
                      TextButton.icon(
                        icon: Icon(isNewPatient ? Icons.person : Icons.person_add),
                        label: Text(isNewPatient ? 'Select Existing' : 'New Patient'),
                        onPressed: () {
                          setModalState(() {
                            isNewPatient = !isNewPatient;
                            selectedPatient = null;
                          });
                        },
                      ),
                    ],
                  ),
                  if (!isNewPatient)
                    DropdownButtonFormField<Map<String, dynamic>>(
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      hint: const Text('Select patient'),
                      value: selectedPatient,
                      items: _patients.map((p) => DropdownMenuItem(
                        value: p,
                        child: Text('${p['fullName'] ?? 'Unknown'}${p['phoneNumber'] != null ? ' (${p['phoneNumber']})' : ''}'),
                      )).toList(),
                      onChanged: (val) => setModalState(() => selectedPatient = val),
                    )
                  else ...[
                    TextField(
                      controller: newPatientNameController,
                      decoration: const InputDecoration(
                        labelText: 'Patient Name *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: newPatientPhoneController,
                      decoration: const InputDecoration(
                        labelText: 'Phone Number',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.phone,
                    ),
                  ],
                  const SizedBox(height: 16),

                  // Doctor selection
                  const Text('Doctor:', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<Doctor>(
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    hint: const Text('Select doctor'),
                    value: selectedDoctor,
                    items: _doctors.map((d) => DropdownMenuItem(
                      value: d,
                      child: Text(d.fullName),
                    )).toList(),
                    onChanged: (val) {
                      setModalState(() {
                        selectedDoctor = val;
                        selectedService = null;
                        selectedTime = null;
                        availableSlots = [];
                      });
                    },
                  ),
                  const SizedBox(height: 16),

                  // Service selection
                  if (selectedDoctor != null) ...[
                    const Text('Service:', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      hint: const Text('Select service'),
                      value: selectedService,
                      items: selectedDoctor!.specialties.map((s) => DropdownMenuItem(
                        value: s,
                        child: Text(s),
                      )).toList(),
                      onChanged: (val) {
                        setModalState(() => selectedService = val);
                        loadSlots();
                      },
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Date selection
                  const Text('Date:', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: appointmentDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 90)),
                      );
                      if (picked != null) {
                        setModalState(() => appointmentDate = picked);
                        loadSlots();
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 20),
                          const SizedBox(width: 8),
                          Text(DateFormat('EEE, MMM d, yyyy').format(appointmentDate)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Time slots
                  if (selectedDoctor != null && selectedService != null) ...[
                    const Text('Time:', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    if (loadingSlots)
                      const Center(child: CircularProgressIndicator())
                    else if (availableSlots.isEmpty)
                      const Text('No available slots', style: TextStyle(color: Colors.grey))
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: availableSlots.map((slot) {
                          final isAvailable = slot.available;
                          final isSelected = selectedTime == slot.time;
                          return ChoiceChip(
                            label: Text(slot.time),
                            selected: isSelected,
                            onSelected: isAvailable ? (val) {
                              setModalState(() => selectedTime = val ? slot.time : null);
                            } : null,
                            backgroundColor: isAvailable ? null : Colors.grey[300],
                            labelStyle: TextStyle(
                              color: !isAvailable ? Colors.grey : null,
                              decoration: !isAvailable ? TextDecoration.lineThrough : null,
                            ),
                          );
                        }).toList(),
                      ),
                    const SizedBox(height: 16),
                  ],

                  // Notes
                  TextField(
                    controller: notesController,
                    decoration: const InputDecoration(
                      labelText: 'Notes (optional)',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 24),

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: (selectedDoctor != null && selectedService != null && selectedTime != null &&
                          (selectedPatient != null || (isNewPatient && newPatientNameController.text.isNotEmpty)))
                          ? () async {
                              try {
                                String patientId;
                                if (isNewPatient) {
                                  final newPatient = await _apiService.createPatient(
                                    fullName: newPatientNameController.text,
                                    phoneNumber: newPatientPhoneController.text,
                                  );
                                  patientId = newPatient['id'];
                                } else {
                                  patientId = selectedPatient!['id'];
                                }

                                await _apiService.adminCreateAppointment(
                                  patientId: patientId,
                                  doctorId: selectedDoctor!.id,
                                  appointmentDate: appointmentDate,
                                  appointmentTime: selectedTime!,
                                  serviceType: selectedService!,
                                  notes: notesController.text,
                                );
                                if (mounted) {
                                  Navigator.pop(ctx);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Appointment created successfully'),
                                      backgroundColor: AppTheme.successColor,
                                    ),
                                  );
                                  _loadAppointments();
                                  _loadDoctorsAndPatients();
                                }
                              } catch (e) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
                                    backgroundColor: AppTheme.errorColor,
                                  ),
                                );
                              }
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text('Create Appointment'),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEEE, MMMM d, yyyy');

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateAppointmentDialog,
        child: const Icon(Icons.add),
      ),
      body: Column(
      children: [
        // Date selector
        Container(
          padding: const EdgeInsets.all(AppTheme.spacingM),
          color: Colors.white,
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () {
                  setState(() {
                    _selectedDate = _selectedDate.subtract(const Duration(days: 1));
                  });
                  _loadAppointments();
                },
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate,
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2030),
                    );
                    if (picked != null) {
                      setState(() {
                        _selectedDate = picked;
                      });
                      _loadAppointments();
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spacingM,
                      vertical: AppTheme.spacingS,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusS),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.calendar_today,
                          size: 18,
                          color: AppTheme.primaryColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          dateFormat.format(_selectedDate),
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () {
                  setState(() {
                    _selectedDate = _selectedDate.add(const Duration(days: 1));
                  });
                  _loadAppointments();
                },
              ),
            ],
          ),
        ),

        // Appointments list
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _errorMessage != null
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(AppTheme.spacingL),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
                            const SizedBox(height: AppTheme.spacingM),
                            Text(
                              _errorMessage!,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: AppTheme.spacingM),
                            ElevatedButton(
                              onPressed: _loadAppointments,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ),
                    )
                  : _appointments.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.event_available,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: AppTheme.spacingM),
                              Text(
                                'No appointments for this day',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      color: Colors.grey[600],
                                    ),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadAppointments,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(AppTheme.spacingM),
                            itemCount: _appointments.length,
                            itemBuilder: (context, index) {
                              final appointment = _appointments[index];
                              return _AppointmentTile(
                                appointment: appointment,
                                onStatusChange: _updateStatus,
                              );
                            },
                          ),
                        ),
        ),
      ],
      ),
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  final Appointment appointment;
  final Function(Appointment, String) onStatusChange;

  const _AppointmentTile({
    required this.appointment,
    required this.onStatusChange,
  });

  Color _getStatusColor() {
    switch (appointment.status.toLowerCase()) {
      case 'confirmed':
      case 'scheduled':
        return AppTheme.successColor;
      case 'pending':
        return AppTheme.warningColor;
      case 'cancelled':
        return AppTheme.errorColor;
      case 'completed':
        return AppTheme.accentColor;
      case 'no-show':
        return Colors.grey;
      default:
        return AppTheme.textSecondary;
    }
  }

  void _showStatusDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Update Status',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                appointment.patientName ?? 'Patient',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
              const SizedBox(height: 16),
              if (appointment.status == 'pending') ...[
                ListTile(
                  leading: const Icon(Icons.check_circle, color: AppTheme.successColor),
                  title: const Text('Confirm Appointment'),
                  onTap: () {
                    Navigator.pop(ctx);
                    onStatusChange(appointment, 'scheduled');
                  },
                ),
              ],
              ListTile(
                leading: const Icon(Icons.task_alt, color: AppTheme.accentColor),
                title: const Text('Mark as Completed'),
                onTap: () {
                  Navigator.pop(ctx);
                  onStatusChange(appointment, 'completed');
                },
              ),
              ListTile(
                leading: const Icon(Icons.cancel, color: AppTheme.errorColor),
                title: const Text('Cancel Appointment'),
                onTap: () {
                  Navigator.pop(ctx);
                  onStatusChange(appointment, 'cancelled');
                },
              ),
              ListTile(
                leading: Icon(Icons.person_off, color: Colors.grey[600]),
                title: const Text('Mark as No-Show'),
                onTap: () {
                  Navigator.pop(ctx);
                  onStatusChange(appointment, 'no-show');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor();
    final isPending = appointment.status.toLowerCase() == 'pending';

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingS),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        side: isPending ? BorderSide(color: AppTheme.warningColor, width: 2) : BorderSide.none,
      ),
      child: InkWell(
        onTap: () => _showStatusDialog(context),
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        child: Padding(
          padding: const EdgeInsets.all(AppTheme.spacingM),
          child: Row(
            children: [
              // Status indicator
              Container(
                width: 4,
                height: 60,
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: AppTheme.spacingM),
              // Main content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            appointment.patientName ?? 'Patient',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            appointment.status.toUpperCase(),
                            style: TextStyle(
                              color: statusColor,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          appointment.appointmentTime,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        const SizedBox(width: 16),
                        Icon(Icons.medical_services, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            appointment.serviceType,
                            style: TextStyle(color: Colors.grey[600]),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    if (appointment.doctorName != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.person, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            'Dr. ${appointment.doctorName}',
                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              // Action indicator
              if (isPending)
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.warningColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.pending_actions,
                    color: AppTheme.warningColor,
                    size: 20,
                  ),
                )
              else
                const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}

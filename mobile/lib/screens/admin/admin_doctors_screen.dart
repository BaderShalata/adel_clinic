import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/api_service.dart';
import '../../models/doctor.dart';
import '../../models/slot_info.dart';
import '../../theme/app_theme.dart';
import 'doctor_form_screen.dart';

class AdminDoctorsScreen extends StatefulWidget {
  const AdminDoctorsScreen({super.key});

  @override
  State<AdminDoctorsScreen> createState() => _AdminDoctorsScreenState();
}

class _AdminDoctorsScreenState extends State<AdminDoctorsScreen> {
  final ApiService _apiService = ApiService();
  List<Doctor> _doctors = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  Future<void> _loadDoctors() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final doctors = await _apiService.getDoctors();
      setState(() {
        _doctors = doctors;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Widget _buildDoctorAvatar(Doctor doctor) {
    if (doctor.imageUrl != null && doctor.imageUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 24,
        backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
        child: ClipOval(
          child: CachedNetworkImage(
            imageUrl: doctor.imageUrl!,
            width: 48,
            height: 48,
            fit: BoxFit.cover,
            placeholder: (context, url) => const CircularProgressIndicator(strokeWidth: 2),
            errorWidget: (context, url, error) => Text(
              doctor.fullName.isNotEmpty ? doctor.fullName[0].toUpperCase() : 'D',
              style: const TextStyle(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      );
    }
    return CircleAvatar(
      radius: 24,
      backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
      child: Text(
        doctor.fullName.isNotEmpty ? doctor.fullName[0].toUpperCase() : 'D',
        style: const TextStyle(
          color: AppTheme.primaryColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  void _editDoctor(Doctor doctor) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => DoctorFormScreen(doctor: doctor)),
    );
    if (result == true) {
      _loadDoctors();
    }
  }

  Future<void> _confirmDeleteDoctor(Doctor doctor) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Doctor'),
        content: Text('Are you sure you want to delete ${doctor.fullName}? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.errorColor),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _apiService.deleteDoctor(doctor.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${doctor.fullName} deleted'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          _loadDoctors();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to delete: ${e.toString().replaceAll('Exception: ', '')}'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    }
  }

  void _showDoctorSchedule(Doctor doctor) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _DoctorScheduleScreen(doctor: doctor),
      ),
    );
  }

  void _navigateToAddDoctor() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const DoctorFormScreen()),
    );
    // Refresh the list if a doctor was added
    if (result == true) {
      _loadDoctors();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateToAddDoctor,
        icon: const Icon(Icons.person_add),
        label: const Text('Add Doctor'),
        backgroundColor: AppTheme.primaryColor,
      ),
      body: _isLoading
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
                        Text(_errorMessage!, textAlign: TextAlign.center),
                        const SizedBox(height: AppTheme.spacingM),
                        ElevatedButton(
                          onPressed: _loadDoctors,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadDoctors,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(
                      left: AppTheme.spacingM,
                      right: AppTheme.spacingM,
                      top: AppTheme.spacingM,
                      bottom: 80, // Extra padding for FAB
                    ),
                    itemCount: _doctors.length,
                    itemBuilder: (context, index) {
                      final doctor = _doctors[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: AppTheme.spacingS),
                        child: ListTile(
                          leading: _buildDoctorAvatar(doctor),
                          title: Text(
                            doctor.fullName,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            doctor.specialties.join(', '),
                            style: TextStyle(color: Colors.grey[600], fontSize: 13),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.edit, color: AppTheme.primaryColor),
                                onPressed: () => _editDoctor(doctor),
                                tooltip: 'Edit',
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete, color: AppTheme.errorColor),
                                onPressed: () => _confirmDeleteDoctor(doctor),
                                tooltip: 'Delete',
                              ),
                              const Icon(Icons.schedule),
                            ],
                          ),
                          onTap: () => _showDoctorSchedule(doctor),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _DoctorScheduleScreen extends StatefulWidget {
  final Doctor doctor;

  const _DoctorScheduleScreen({required this.doctor});

  @override
  State<_DoctorScheduleScreen> createState() => _DoctorScheduleScreenState();
}

class _DoctorScheduleScreenState extends State<_DoctorScheduleScreen> {
  final ApiService _apiService = ApiService();
  DateTime _selectedDate = DateTime.now();
  List<SlotInfo> _slots = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadSlots();
  }

  Future<void> _loadSlots() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiService.getAvailableSlots(
        widget.doctor.id,
        _selectedDate,
      );
      setState(() {
        _slots = response.slots;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _lockSlot(SlotInfo slot) async {
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    try {
      await _apiService.lockSlot(
        doctorId: widget.doctor.id,
        date: dateStr,
        time: slot.time,
        reason: 'Admin locked',
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Locked ${slot.time}'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      _loadSlots();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Future<void> _unlockSlot(SlotInfo slot) async {
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    try {
      await _apiService.unlockSlot(
        doctorId: widget.doctor.id,
        date: dateStr,
        time: slot.time,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Unlocked ${slot.time}'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      _loadSlots();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEE, MMM d, yyyy');

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.doctor.fullName),
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
                    _loadSlots();
                  },
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 90)),
                      );
                      if (picked != null) {
                        setState(() {
                          _selectedDate = picked;
                        });
                        _loadSlots();
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
                    _loadSlots();
                  },
                ),
              ],
            ),
          ),

          // Legend
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingM),
            child: Row(
              children: [
                _LegendItem(color: AppTheme.successColor, label: 'Available'),
                const SizedBox(width: 16),
                _LegendItem(color: Colors.grey, label: 'Booked'),
                const SizedBox(width: 16),
                _LegendItem(color: AppTheme.warningColor, label: 'Locked'),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Slots grid
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(_errorMessage!),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _loadSlots,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _slots.isEmpty
                        ? const Center(
                            child: Text('No slots available for this day'),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadSlots,
                            child: GridView.builder(
                              padding: const EdgeInsets.all(AppTheme.spacingM),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 4,
                                crossAxisSpacing: 8,
                                mainAxisSpacing: 8,
                                childAspectRatio: 1.5,
                              ),
                              itemCount: _slots.length,
                              itemBuilder: (context, index) {
                                final slot = _slots[index];
                                final isLocked = slot.locked ?? false;
                                final isAvailable = slot.available && !isLocked;
                                final isBooked = !slot.available && !isLocked;

                                Color bgColor;
                                Color textColor;
                                IconData? icon;

                                if (isLocked) {
                                  bgColor = AppTheme.warningColor.withValues(alpha: 0.2);
                                  textColor = AppTheme.warningColor;
                                  icon = Icons.lock;
                                } else if (isBooked) {
                                  bgColor = Colors.grey.withValues(alpha: 0.2);
                                  textColor = Colors.grey;
                                  icon = Icons.event_busy;
                                } else {
                                  bgColor = AppTheme.successColor.withValues(alpha: 0.2);
                                  textColor = AppTheme.successColor;
                                  icon = null;
                                }

                                return InkWell(
                                  onTap: () {
                                    if (isBooked) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('This slot is booked')),
                                      );
                                      return;
                                    }
                                    // Show lock/unlock options
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
                                                slot.time,
                                                style: const TextStyle(
                                                  fontSize: 20,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 16),
                                              if (isLocked)
                                                ListTile(
                                                  leading: const Icon(Icons.lock_open, color: AppTheme.successColor),
                                                  title: const Text('Unlock Slot'),
                                                  subtitle: const Text('Make this slot available for booking'),
                                                  onTap: () {
                                                    Navigator.pop(ctx);
                                                    _unlockSlot(slot);
                                                  },
                                                )
                                              else
                                                ListTile(
                                                  leading: const Icon(Icons.lock, color: AppTheme.warningColor),
                                                  title: const Text('Lock Slot'),
                                                  subtitle: const Text('Prevent bookings for this slot'),
                                                  onTap: () {
                                                    Navigator.pop(ctx);
                                                    _lockSlot(slot);
                                                  },
                                                ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: bgColor,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: textColor.withValues(alpha: 0.3)),
                                    ),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        if (icon != null)
                                          Icon(icon, size: 14, color: textColor),
                                        Text(
                                          slot.time,
                                          style: TextStyle(
                                            color: textColor,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
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

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(2),
            border: Border.all(color: color),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

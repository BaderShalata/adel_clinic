import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/doctor.dart';
import '../../providers/doctor_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';

class DoctorFormScreen extends StatefulWidget {
  final Doctor? doctor; // null for new doctor, existing for edit

  const DoctorFormScreen({super.key, this.doctor});

  @override
  State<DoctorFormScreen> createState() => _DoctorFormScreenState();
}

class _DoctorFormScreenState extends State<DoctorFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _apiService = ApiService();
  final _imagePicker = ImagePicker();
  bool _isLoading = false;

  // Basic info controllers
  final _fullNameController = TextEditingController();
  final _fullNameEnController = TextEditingController();
  final _fullNameHeController = TextEditingController();
  final _imageUrlController = TextEditingController();

  // Image state
  File? _selectedImage;
  bool _useImageUrl = true; // Toggle between URL and device image

  // Specialties
  final List<String> _specialties = [];
  final List<String> _specialtiesEn = [];
  final _specialtyController = TextEditingController();
  final _specialtyEnController = TextEditingController();

  // Qualifications
  final List<String> _qualifications = [];
  final List<String> _qualificationsEn = [];
  final _qualificationController = TextEditingController();
  final _qualificationEnController = TextEditingController();

  // Schedule
  final List<Map<String, dynamic>> _schedule = [];

  bool get isEditing => widget.doctor != null;

  @override
  void initState() {
    super.initState();
    if (widget.doctor != null) {
      _loadDoctorData(widget.doctor!);
    }
  }

  void _loadDoctorData(Doctor doctor) {
    _fullNameController.text = doctor.fullName;
    _fullNameEnController.text = doctor.fullNameEn ?? '';
    _fullNameHeController.text = doctor.fullNameHe ?? '';
    _imageUrlController.text = doctor.imageUrl ?? '';
    _specialties.addAll(doctor.specialties);
    _specialtiesEn.addAll(doctor.specialtiesEn ?? []);
    _qualifications.addAll(doctor.qualifications);
    _qualificationsEn.addAll(doctor.qualificationsEn ?? []);
    _schedule.addAll(doctor.schedule.map((s) => {
          'dayOfWeek': s.dayOfWeek,
          'startTime': s.startTime,
          'endTime': s.endTime,
          'slotDuration': s.slotDuration,
          'type': s.type,
        }));
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _fullNameEnController.dispose();
    _fullNameHeController.dispose();
    _imageUrlController.dispose();
    _specialtyController.dispose();
    _specialtyEnController.dispose();
    _qualificationController.dispose();
    _qualificationEnController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        setState(() {
          _selectedImage = File(pickedFile.path);
          _useImageUrl = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to pick image: $e'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showImagePickerOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(AppTheme.spacingL),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppTheme.radiusXL),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppTheme.spacingL),
              decoration: BoxDecoration(
                color: AppTheme.dividerColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Text(
              'Choose Image Source',
              style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingL),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.camera_alt, color: AppTheme.primaryColor),
              ),
              title: const Text('Take Photo'),
              subtitle: const Text('Use camera to capture'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.photo_library, color: AppTheme.accentColor),
              ),
              title: const Text('Choose from Gallery'),
              subtitle: const Text('Select existing photo'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.link, color: Colors.blue),
              ),
              title: const Text('Use URL'),
              subtitle: const Text('Enter image link'),
              onTap: () {
                Navigator.pop(ctx);
                setState(() {
                  _useImageUrl = true;
                  _selectedImage = null;
                });
              },
            ),
            const SizedBox(height: AppTheme.spacingS),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePreview() {
    // Show selected device image
    if (_selectedImage != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          Image.file(
            _selectedImage!,
            fit: BoxFit.cover,
          ),
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: () => setState(() => _selectedImage = null),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppTheme.errorColor,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, color: Colors.white, size: 14),
              ),
            ),
          ),
        ],
      );
    }

    // Show URL image
    if (_useImageUrl && _imageUrlController.text.isNotEmpty) {
      return Stack(
        fit: StackFit.expand,
        children: [
          CachedNetworkImage(
            imageUrl: _imageUrlController.text,
            fit: BoxFit.cover,
            placeholder: (context, url) => const Center(
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            errorWidget: (context, url, error) => const Center(
              child: Icon(Icons.error_outline, color: AppTheme.errorColor),
            ),
          ),
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: () => setState(() => _imageUrlController.clear()),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: AppTheme.errorColor,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, color: Colors.white, size: 14),
              ),
            ),
          ),
        ],
      );
    }

    // Placeholder
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.add_a_photo, size: 32, color: AppTheme.textHint),
        const SizedBox(height: 4),
        Text(
          'Add Photo',
          style: TextStyle(fontSize: 10, color: AppTheme.textHint),
        ),
      ],
    );
  }

  void _addSpecialty() {
    final specialty = _specialtyController.text.trim();
    final specialtyEn = _specialtyEnController.text.trim();
    if (specialty.isNotEmpty) {
      setState(() {
        _specialties.add(specialty);
        _specialtiesEn.add(specialtyEn.isNotEmpty ? specialtyEn : specialty);
      });
      _specialtyController.clear();
      _specialtyEnController.clear();
    }
  }

  void _removeSpecialty(int index) {
    setState(() {
      _specialties.removeAt(index);
      if (index < _specialtiesEn.length) {
        _specialtiesEn.removeAt(index);
      }
    });
  }

  void _addQualification() {
    final qual = _qualificationController.text.trim();
    final qualEn = _qualificationEnController.text.trim();
    if (qual.isNotEmpty) {
      setState(() {
        _qualifications.add(qual);
        _qualificationsEn.add(qualEn.isNotEmpty ? qualEn : qual);
      });
      _qualificationController.clear();
      _qualificationEnController.clear();
    }
  }

  void _removeQualification(int index) {
    setState(() {
      _qualifications.removeAt(index);
      if (index < _qualificationsEn.length) {
        _qualificationsEn.removeAt(index);
      }
    });
  }

  void _addSchedule() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ScheduleFormSheet(
        onSave: (schedule) {
          setState(() {
            _schedule.add(schedule);
          });
        },
      ),
    );
  }

  void _removeSchedule(int index) {
    setState(() {
      _schedule.removeAt(index);
    });
  }

  Future<void> _saveDoctor() async {
    if (!_formKey.currentState!.validate()) return;

    if (_specialties.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one specialty'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (isEditing) {
        await _apiService.updateDoctor(
          doctorId: widget.doctor!.id,
          fullName: _fullNameController.text.trim(),
          fullNameEn: _fullNameEnController.text.trim().isNotEmpty
              ? _fullNameEnController.text.trim()
              : null,
          fullNameHe: _fullNameHeController.text.trim().isNotEmpty
              ? _fullNameHeController.text.trim()
              : null,
          specialties: _specialties,
          specialtiesEn: _specialtiesEn.isNotEmpty ? _specialtiesEn : null,
          qualifications: _qualifications,
          qualificationsEn: _qualificationsEn.isNotEmpty ? _qualificationsEn : null,
          imageUrl: _imageUrlController.text.trim().isNotEmpty
              ? _imageUrlController.text.trim()
              : null,
          schedule: _schedule,
        );
      } else {
        await _apiService.createDoctor(
          userId: 'temp-${DateTime.now().millisecondsSinceEpoch}',
          fullName: _fullNameController.text.trim(),
          fullNameEn: _fullNameEnController.text.trim().isNotEmpty
              ? _fullNameEnController.text.trim()
              : null,
          fullNameHe: _fullNameHeController.text.trim().isNotEmpty
              ? _fullNameHeController.text.trim()
              : null,
          specialties: _specialties,
          specialtiesEn: _specialtiesEn.isNotEmpty ? _specialtiesEn : null,
          qualifications: _qualifications,
          qualificationsEn: _qualificationsEn.isNotEmpty ? _qualificationsEn : null,
          imageUrl: _imageUrlController.text.trim().isNotEmpty
              ? _imageUrlController.text.trim()
              : null,
          schedule: _schedule,
        );
      }

      if (!mounted) return;

      // Reload doctors list
      context.read<DoctorProvider>().loadDoctors();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text(isEditing ? 'Doctor updated successfully' : 'Doctor created successfully'),
            ],
          ),
          backgroundColor: AppTheme.successColor,
        ),
      );

      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Doctor' : 'Add Doctor'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveDoctor,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppTheme.spacingM),
          children: [
            // Basic Information Section
            _buildSectionHeader('Basic Information', Icons.person),
            ModernCard(
              child: Column(
                children: [
                  TextFormField(
                    controller: _fullNameController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name (Arabic) *',
                      hintText: 'Enter doctor name in Arabic',
                    ),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  TextFormField(
                    controller: _fullNameEnController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name (English)',
                      hintText: 'Enter doctor name in English',
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  TextFormField(
                    controller: _fullNameHeController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name (Hebrew)',
                      hintText: 'Enter doctor name in Hebrew',
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: AppTheme.spacingL),
                  // Profile Image Section
                  Text(
                    'Profile Photo',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: AppTheme.spacingS),
                  Row(
                    children: [
                      // Image preview
                      GestureDetector(
                        onTap: _showImagePickerOptions,
                        child: Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceMedium,
                            borderRadius: BorderRadius.circular(AppTheme.radiusM),
                            border: Border.all(
                              color: AppTheme.dividerColor,
                              width: 2,
                            ),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _buildImagePreview(),
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacingM),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ElevatedButton.icon(
                              onPressed: _showImagePickerOptions,
                              icon: const Icon(Icons.add_a_photo, size: 18),
                              label: Text(_selectedImage != null || _imageUrlController.text.isNotEmpty
                                  ? 'Change Photo'
                                  : 'Add Photo'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                              ),
                            ),
                            const SizedBox(height: AppTheme.spacingS),
                            Text(
                              'Tap to upload from camera, gallery, or use URL',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.textHint,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  // URL input (shown when using URL mode)
                  if (_useImageUrl) ...[
                    const SizedBox(height: AppTheme.spacingM),
                    TextFormField(
                      controller: _imageUrlController,
                      decoration: const InputDecoration(
                        labelText: 'Image URL',
                        hintText: 'https://example.com/photo.jpg',
                        prefixIcon: Icon(Icons.link),
                      ),
                      keyboardType: TextInputType.url,
                      onChanged: (_) => setState(() {}),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Specialties Section
            _buildSectionHeader('Specialties', Icons.medical_services),
            ModernCard(
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _specialtyController,
                          decoration: const InputDecoration(
                            labelText: 'Specialty (Arabic)',
                            hintText: 'e.g., طب الأطفال',
                          ),
                          textDirection: TextDirection.rtl,
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacingS),
                      Expanded(
                        child: TextField(
                          controller: _specialtyEnController,
                          decoration: const InputDecoration(
                            labelText: 'English',
                            hintText: 'e.g., Pediatrics',
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add_circle, color: AppTheme.primaryColor),
                        onPressed: _addSpecialty,
                      ),
                    ],
                  ),
                  if (_specialties.isNotEmpty) ...[
                    const SizedBox(height: AppTheme.spacingM),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: List.generate(_specialties.length, (index) {
                        return Chip(
                          label: Text(_specialties[index]),
                          deleteIcon: const Icon(Icons.close, size: 16),
                          onDeleted: () => _removeSpecialty(index),
                        );
                      }),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Qualifications Section
            _buildSectionHeader('Qualifications', Icons.school),
            ModernCard(
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _qualificationController,
                          decoration: const InputDecoration(
                            labelText: 'Qualification (Arabic)',
                          ),
                          textDirection: TextDirection.rtl,
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacingS),
                      Expanded(
                        child: TextField(
                          controller: _qualificationEnController,
                          decoration: const InputDecoration(
                            labelText: 'English',
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add_circle, color: AppTheme.primaryColor),
                        onPressed: _addQualification,
                      ),
                    ],
                  ),
                  if (_qualifications.isNotEmpty) ...[
                    const SizedBox(height: AppTheme.spacingM),
                    ...List.generate(_qualifications.length, (index) {
                      return ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.check_circle, color: AppTheme.successColor, size: 20),
                        title: Text(_qualifications[index]),
                        trailing: IconButton(
                          icon: const Icon(Icons.remove_circle, color: AppTheme.errorColor, size: 20),
                          onPressed: () => _removeQualification(index),
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Schedule Section
            _buildSectionHeader('Schedule', Icons.calendar_month),
            ModernCard(
              child: Column(
                children: [
                  if (_schedule.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(AppTheme.spacingM),
                      child: Text(
                        'No schedule added yet',
                        style: TextStyle(color: AppTheme.textHint),
                      ),
                    )
                  else
                    ...List.generate(_schedule.length, (index) {
                      final s = _schedule[index];
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              dayNames[s['dayOfWeek'] as int],
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryColor,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                        title: Text('${s['startTime']} - ${s['endTime']}'),
                        subtitle: Text('${s['slotDuration']} min slots • ${s['type'] ?? 'General'}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline, color: AppTheme.errorColor),
                          onPressed: () => _removeSchedule(index),
                        ),
                      );
                    }),
                  const SizedBox(height: AppTheme.spacingS),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _addSchedule,
                      icon: const Icon(Icons.add),
                      label: const Text('Add Schedule'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppTheme.spacingXL),

            // Save Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveDoctor,
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(isEditing ? 'Update Doctor' : 'Create Doctor'),
              ),
            ),
            const SizedBox(height: AppTheme.spacingXL),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.spacingS),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primaryColor),
          const SizedBox(width: AppTheme.spacingS),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }
}

class _ScheduleFormSheet extends StatefulWidget {
  final Function(Map<String, dynamic>) onSave;

  const _ScheduleFormSheet({required this.onSave});

  @override
  State<_ScheduleFormSheet> createState() => _ScheduleFormSheetState();
}

class _ScheduleFormSheetState extends State<_ScheduleFormSheet> {
  int _selectedDay = 0;
  TimeOfDay _startTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 17, minute: 0);
  int _slotDuration = 15;
  final _typeController = TextEditingController();

  final dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  String _formatTime(TimeOfDay time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _selectStartTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _startTime,
    );
    if (time != null) {
      setState(() => _startTime = time);
    }
  }

  Future<void> _selectEndTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _endTime,
    );
    if (time != null) {
      setState(() => _endTime = time);
    }
  }

  void _save() {
    widget.onSave({
      'dayOfWeek': _selectedDay,
      'startTime': _formatTime(_startTime),
      'endTime': _formatTime(_endTime),
      'slotDuration': _slotDuration,
      'type': _typeController.text.trim().isNotEmpty ? _typeController.text.trim() : null,
    });
    Navigator.pop(context);
  }

  @override
  void dispose() {
    _typeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: AppTheme.spacingL,
        right: AppTheme.spacingL,
        top: AppTheme.spacingL,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppTheme.spacingL,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusXL)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingL),
            Text(
              'Add Schedule',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Day selection
            Text('Day of Week', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: AppTheme.spacingS),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(7, (index) {
                final isSelected = _selectedDay == index;
                return ChoiceChip(
                  label: Text(dayNames[index].substring(0, 3)),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() => _selectedDay = index);
                  },
                );
              }),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Time selection
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Start Time', style: Theme.of(context).textTheme.labelLarge),
                      const SizedBox(height: AppTheme.spacingS),
                      InkWell(
                        onTap: _selectStartTime,
                        child: Container(
                          padding: const EdgeInsets.all(AppTheme.spacingM),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.dividerColor),
                            borderRadius: BorderRadius.circular(AppTheme.radiusM),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.access_time, size: 18),
                              const SizedBox(width: 8),
                              Text(_formatTime(_startTime)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('End Time', style: Theme.of(context).textTheme.labelLarge),
                      const SizedBox(height: AppTheme.spacingS),
                      InkWell(
                        onTap: _selectEndTime,
                        child: Container(
                          padding: const EdgeInsets.all(AppTheme.spacingM),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.dividerColor),
                            borderRadius: BorderRadius.circular(AppTheme.radiusM),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.access_time, size: 18),
                              const SizedBox(width: 8),
                              Text(_formatTime(_endTime)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Slot duration
            Text('Slot Duration (minutes)', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: AppTheme.spacingS),
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 10, label: Text('10')),
                ButtonSegment(value: 15, label: Text('15')),
                ButtonSegment(value: 20, label: Text('20')),
                ButtonSegment(value: 30, label: Text('30')),
              ],
              selected: {_slotDuration},
              onSelectionChanged: (Set<int> selection) {
                setState(() => _slotDuration = selection.first);
              },
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Service type
            TextField(
              controller: _typeController,
              decoration: const InputDecoration(
                labelText: 'Service Type (optional)',
                hintText: 'e.g., Pediatrics, Consultation',
              ),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Save button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _save,
                child: const Text('Add Schedule'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:convert';
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

  // Bio controllers
  final _bioController = TextEditingController();
  final _bioEnController = TextEditingController();
  final _bioHeController = TextEditingController();

  // Image state
  File? _selectedImage;
  String? _existingImageUrl; // Existing image URL from the doctor

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
    _existingImageUrl = doctor.imageUrl;
    _bioController.text = doctor.bio ?? '';
    _bioEnController.text = doctor.bioEn ?? '';
    _bioHeController.text = doctor.bioHe ?? '';
    _specialties.addAll(doctor.specialties);
    _specialtiesEn.addAll(doctor.specialtiesEn ?? []);
    _qualifications.addAll(doctor.qualifications);
    _qualificationsEn.addAll(doctor.qualificationsEn ?? []);
    _schedule.addAll(doctor.schedule.map((s) => <String, dynamic>{
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
    _bioController.dispose();
    _bioEnController.dispose();
    _bioHeController.dispose();
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
          _existingImageUrl = null; // Clear existing URL when new image selected
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
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppTheme.radiusL),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Modern Gradient Header
            Container(
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(AppTheme.radiusL)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingM, vertical: AppTheme.spacingM),
              child: SafeArea(
                bottom: false,
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(AppTheme.radiusS),
                      ),
                      child: const Icon(Icons.add_a_photo, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: AppTheme.spacingM),
                    Expanded(
                      child: Text(
                        'Choose Image Source',
                        style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close, color: Colors.white70),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white.withValues(alpha: 0.1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(AppTheme.spacingM),
              child: Column(
                children: [
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
                ],
              ),
            ),
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

    // Show existing image from URL
    if (_existingImageUrl != null && _existingImageUrl!.isNotEmpty) {
      return Stack(
        fit: StackFit.expand,
        children: [
          CachedNetworkImage(
            imageUrl: _existingImageUrl!,
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
              onTap: () => setState(() => _existingImageUrl = null),
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
      // Upload image to Firebase Storage if a file was selected
      String? imageUrl = _existingImageUrl;

      if (_selectedImage != null) {
        final bytes = await _selectedImage!.readAsBytes();
        final base64Image = base64Encode(bytes);
        final fileName = 'doctor_${DateTime.now().millisecondsSinceEpoch}.jpg';
        final extension = _selectedImage!.path.split('.').last.toLowerCase();
        final mimeType = extension == 'png' ? 'image/png' : 'image/jpeg';

        imageUrl = await _apiService.uploadImage(
          base64Image: base64Image,
          fileName: fileName,
          folder: 'doctors',
          mimeType: mimeType,
        );
      }

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
          bio: _bioController.text.trim().isNotEmpty
              ? _bioController.text.trim()
              : null,
          bioEn: _bioEnController.text.trim().isNotEmpty
              ? _bioEnController.text.trim()
              : null,
          bioHe: _bioHeController.text.trim().isNotEmpty
              ? _bioHeController.text.trim()
              : null,
          imageUrl: imageUrl,
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
          bio: _bioController.text.trim().isNotEmpty
              ? _bioController.text.trim()
              : null,
          bioEn: _bioEnController.text.trim().isNotEmpty
              ? _bioEnController.text.trim()
              : null,
          bioHe: _bioHeController.text.trim().isNotEmpty
              ? _bioHeController.text.trim()
              : null,
          imageUrl: imageUrl,
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
                              label: Text(_selectedImage != null || (_existingImageUrl != null && _existingImageUrl!.isNotEmpty)
                                  ? 'Change Photo'
                                  : 'Add Photo'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                              ),
                            ),
                            const SizedBox(height: AppTheme.spacingS),
                            Text(
                              'Take a photo or choose from gallery',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.textHint,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppTheme.spacingL),

            // Bio/About Section
            _buildSectionHeader('About / Bio', Icons.info_outline),
            ModernCard(
              child: Column(
                children: [
                  TextFormField(
                    controller: _bioController,
                    decoration: const InputDecoration(
                      labelText: 'Bio / About (Arabic)',
                      hintText: 'Short description about the doctor',
                      alignLabelWithHint: true,
                    ),
                    textDirection: TextDirection.rtl,
                    maxLines: 3,
                    maxLength: 500,
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  TextFormField(
                    controller: _bioEnController,
                    decoration: const InputDecoration(
                      labelText: 'Bio / About (English)',
                      hintText: 'Short description in English',
                      alignLabelWithHint: true,
                    ),
                    maxLines: 3,
                    maxLength: 500,
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  TextFormField(
                    controller: _bioHeController,
                    decoration: const InputDecoration(
                      labelText: 'Bio / About (Hebrew)',
                      hintText: 'Short description in Hebrew',
                      alignLabelWithHint: true,
                    ),
                    textDirection: TextDirection.rtl,
                    maxLines: 3,
                    maxLength: 500,
                  ),
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
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusL)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Modern Gradient Header
          Container(
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppTheme.radiusL)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingM, vertical: AppTheme.spacingM),
            child: SafeArea(
              bottom: false,
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(AppTheme.radiusS),
                    ),
                    child: const Icon(Icons.calendar_month, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: AppTheme.spacingM),
                  Expanded(
                    child: Text(
                      'Add Schedule',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.white70),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Form Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppTheme.spacingL),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                  const SizedBox(height: AppTheme.spacingM),
                ],
              ),
            ),
          ),
          // Footer
          Container(
            padding: EdgeInsets.only(
              left: AppTheme.spacingL,
              right: AppTheme.spacingL,
              top: AppTheme.spacingM,
              bottom: MediaQuery.of(context).viewInsets.bottom > 0
                  ? AppTheme.spacingM
                  : AppTheme.spacingL,
            ),
            decoration: BoxDecoration(
              color: AppTheme.surfaceMedium,
              border: Border(
                top: BorderSide(color: AppTheme.dividerColor, width: 1),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingM),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _save,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Add Schedule'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

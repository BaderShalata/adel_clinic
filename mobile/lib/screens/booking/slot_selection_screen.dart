import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/booking_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/language_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class SlotSelectionScreen extends StatefulWidget {
  const SlotSelectionScreen({super.key});

  @override
  State<SlotSelectionScreen> createState() => _SlotSelectionScreenState();
}

class _SlotSelectionScreenState extends State<SlotSelectionScreen> {
  DateTime _selectedDate = DateTime.now();
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Load slots for today
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingProvider>().selectDate(_selectedDate);
    });
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  List<DateTime> _getNext14Days() {
    final days = <DateTime>[];
    final now = DateTime.now();
    for (int i = 0; i < 14; i++) {
      days.add(DateTime(now.year, now.month, now.day + i));
    }
    return days;
  }

  String _formatDate(DateTime date, LanguageProvider lang) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    final dayName = lang.t(dayKeys[date.weekday % 7]);
    return '$dayName\n${date.day} ${months[date.month - 1]}';
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  Future<void> _showJoinWaitingListDialog(BookingProvider bookingProvider, LanguageProvider lang) async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(lang.t('pleaseLoginToJoinWaitingList')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final waitingListNotesController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(lang.t('joinWaitingList')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              lang.t('willBeAddedToWaitingList'),
              style: Theme.of(ctx).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppTheme.spacingM),
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingM),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppTheme.radiusS),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.person, size: 16, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          bookingProvider.selectedDoctor?.fullName ?? lang.t('doctor'),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.medical_services, size: 16, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(bookingProvider.selectedService ?? ''),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 16, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      Text(
                        '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppTheme.spacingM),
            TextField(
              controller: waitingListNotesController,
              decoration: InputDecoration(
                labelText: lang.t('notesOptional'),
                hintText: lang.t('anySpecificRequirements'),
                border: const OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(lang.t('cancel')),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(lang.t('joinWaitingList')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ApiService().joinWaitingList(
        doctorId: bookingProvider.selectedDoctor!.id,
        preferredDate: _selectedDate,
        serviceType: bookingProvider.selectedService!,
        notes: waitingListNotesController.text.isNotEmpty
            ? waitingListNotesController.text
            : null,
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(lang.t('addedToWaitingList')),
          backgroundColor: AppTheme.successColor,
        ),
      );

      Navigator.of(context).popUntil((route) => route.isFirst);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${lang.t('failedToJoinWaitingList')}: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Future<void> _confirmBooking(LanguageProvider lang) async {
    final bookingProvider = context.read<BookingProvider>();
    final authProvider = context.read<AuthProvider>();

    if (bookingProvider.selectedTimeSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(lang.t('pleaseSelectTimeSlot')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final patientId = authProvider.user?.id;
    if (patientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(lang.t('pleaseLoginToBook')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(lang.t('confirmBooking')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${lang.t('service')}: ${bookingProvider.selectedService}'),
            const SizedBox(height: 8),
            Text('${lang.t('doctor')}: ${bookingProvider.selectedDoctor?.fullName}'),
            const SizedBox(height: 8),
            Text(
              '${lang.t('date')}: ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
            ),
            const SizedBox(height: 8),
            Text('${lang.t('time')}: ${bookingProvider.selectedTimeSlot}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(lang.t('cancel')),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(lang.t('confirm')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final appointment = await bookingProvider.bookAppointment(
      patientId: patientId,
      notes: _notesController.text.isNotEmpty ? _notesController.text : null,
    );

    if (!mounted) return;

    if (appointment != null) {
      // Reload appointments so it shows in the list
      context.read<AppointmentProvider>().loadAppointments();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(lang.t('appointmentBooked')),
          backgroundColor: AppTheme.successColor,
          duration: const Duration(seconds: 4),
        ),
      );
      // Pop all booking screens and go back to main
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(bookingProvider.errorMessage ?? lang.t('failedToBook')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Widget _buildSlotsContent(BuildContext context, BookingProvider bookingProvider, LanguageProvider lang) {
    final slots = bookingProvider.availableSlots;

    // Check if doctor is working on this day (has total slots)
    final isDoctorWorking = slots != null && slots.totalSlots > 0;
    // Check if all slots are full (doctor working but no available slots)
    final allSlotsFull = isDoctorWorking && slots.availableSlots == 0;
    // Check if there are available slots to show
    final hasAvailableSlots = slots != null && slots.slots.isNotEmpty && slots.availableSlots > 0;

    // Doctor is not working on this day
    if (!isDoctorWorking) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_busy,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: AppTheme.spacingM),
            Text(
              lang.t('doctorNotAvailable'),
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    // Doctor is working but all slots are full - show waiting list option
    if (allSlotsFull) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_busy,
              size: 64,
              color: Colors.orange[400],
            ),
            const SizedBox(height: AppTheme.spacingM),
            Text(
              lang.t('allSlotsBooked'),
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(color: Colors.grey[600]),
            ),
            const SizedBox(height: AppTheme.spacingL),
            OutlinedButton.icon(
              onPressed: () => _showJoinWaitingListDialog(bookingProvider, lang),
              icon: const Icon(Icons.schedule),
              label: Text(lang.t('joinWaitingList')),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.primaryColor,
                side: const BorderSide(color: AppTheme.primaryColor),
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingL,
                  vertical: AppTheme.spacingM,
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingS),
            Text(
              lang.t('getNotified'),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[500],
                  ),
            ),
          ],
        ),
      );
    }

    // Show available slots
    if (hasAvailableSlots) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingM,
            ),
            child: Text(
              '${slots.availableSlots} ${lang.t('slotsAvailable')}',
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Colors.grey[600]),
            ),
          ),
          const SizedBox(height: AppTheme.spacingS),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.spacingM,
              ),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                childAspectRatio: 2.2,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: slots.slots.length,
              itemBuilder: (context, index) {
                final slot = slots.slots[index];
                final isSelected = bookingProvider.selectedTimeSlot == slot.time;
                final isAvailable = slot.available;

                return GestureDetector(
                  onTap: isAvailable
                      ? () => bookingProvider.selectTimeSlot(slot.time)
                      : null,
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.primaryColor
                          : isAvailable
                              ? Colors.white
                              : Colors.grey[200],
                      borderRadius: BorderRadius.circular(AppTheme.radiusS),
                      border: Border.all(
                        color: isSelected
                            ? AppTheme.primaryColor
                            : isAvailable
                                ? AppTheme.primaryColor.withValues(alpha: 0.3)
                                : Colors.grey[300]!,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        slot.time,
                        style: TextStyle(
                          color: isSelected
                              ? Colors.white
                              : isAvailable
                                  ? Colors.black87
                                  : Colors.grey[500],
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.normal,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      );
    }

    // Fallback - no slots data
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.event_busy,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: AppTheme.spacingM),
          Text(
            lang.t('noSlotInformation'),
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final days = _getNext14Days();
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('selectTime')),
      ),
      body: Consumer<BookingProvider>(
        builder: (context, bookingProvider, child) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(AppTheme.spacingM),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bookingProvider.selectedDoctor?.fullName ?? lang.t('doctor'),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: AppTheme.spacingXS),
                    Text(
                      bookingProvider.selectedService ?? '',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.primaryColor,
                          ),
                    ),
                  ],
                ),
              ),

              // Date selector
              SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingM),
                  itemCount: days.length,
                  itemBuilder: (context, index) {
                    final date = days[index];
                    final isSelected = _isSameDay(date, _selectedDate);
                    final isToday = _isSameDay(date, DateTime.now());

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedDate = date;
                        });
                        bookingProvider.selectDate(date);
                      },
                      child: Container(
                        width: 60,
                        margin: const EdgeInsets.only(right: AppTheme.spacingS),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppTheme.primaryColor
                              : isToday
                                  ? AppTheme.primaryColor.withValues(alpha: 0.1)
                                  : Colors.grey[100],
                          borderRadius: BorderRadius.circular(AppTheme.radiusM),
                          border: isToday && !isSelected
                              ? Border.all(color: AppTheme.primaryColor)
                              : null,
                        ),
                        child: Center(
                          child: Text(
                            _formatDate(date, lang),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: isSelected ? Colors.white : Colors.black87,
                              fontWeight:
                                  isSelected ? FontWeight.w600 : FontWeight.normal,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: AppTheme.spacingM),

              // Time slots
              Expanded(
                child: bookingProvider.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _buildSlotsContent(context, bookingProvider, lang),
              ),

              // Notes and Book button
              Container(
                padding: const EdgeInsets.all(AppTheme.spacingM),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: Column(
                    children: [
                      TextField(
                        controller: _notesController,
                        decoration: InputDecoration(
                          hintText: lang.t('addNotes'),
                          border: const OutlineInputBorder(),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                        maxLines: 2,
                      ),
                      const SizedBox(height: AppTheme.spacingM),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: bookingProvider.selectedTimeSlot != null &&
                                  !bookingProvider.isLoading
                              ? () => _confirmBooking(lang)
                              : null,
                          child: bookingProvider.isLoading
                              ? const SizedBox(
                                  height: 24,
                                  width: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  lang.t('bookAppointment'),
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

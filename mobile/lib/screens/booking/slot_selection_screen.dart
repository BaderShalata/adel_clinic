import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/booking_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/appointment_provider.dart';
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

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return '${days[date.weekday % 7]}\n${date.day} ${months[date.month - 1]}';
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  Future<void> _showJoinWaitingListDialog(BookingProvider bookingProvider) async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to join the waiting list'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final waitingListNotesController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Join Waiting List'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You will be added to the waiting list for:',
              style: Theme.of(context).textTheme.bodyMedium,
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
                          bookingProvider.selectedDoctor?.fullName ?? 'Doctor',
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
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                hintText: 'Any specific requirements...',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Join Waiting List'),
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
        const SnackBar(
          content: Text('Added to waiting list! We\'ll notify you when a slot opens.'),
          backgroundColor: AppTheme.successColor,
        ),
      );

      Navigator.of(context).popUntil((route) => route.isFirst);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to join waiting list: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Future<void> _confirmBooking() async {
    final bookingProvider = context.read<BookingProvider>();
    final authProvider = context.read<AuthProvider>();

    if (bookingProvider.selectedTimeSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a time slot'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final patientId = authProvider.user?.id;
    if (patientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please log in to book an appointment'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Booking'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Service: ${bookingProvider.selectedService}'),
            const SizedBox(height: 8),
            Text('Doctor: ${bookingProvider.selectedDoctor?.fullName}'),
            const SizedBox(height: 8),
            Text(
              'Date: ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
            ),
            const SizedBox(height: 8),
            Text('Time: ${bookingProvider.selectedTimeSlot}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm'),
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
        const SnackBar(
          content: Text('Appointment booked successfully!'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      // Pop all booking screens and go back to main
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(bookingProvider.errorMessage ?? 'Failed to book appointment'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final days = _getNext14Days();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Time'),
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
                      bookingProvider.selectedDoctor?.fullName ?? 'Doctor',
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
                            _formatDate(date),
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
                    : bookingProvider.availableSlots == null ||
                            bookingProvider.availableSlots!.slots.isEmpty
                        ? Center(
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
                                  bookingProvider.availableSlots?.slots.isEmpty == true
                                      ? 'No available slots on this day'
                                      : 'Doctor is not available on this day',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(color: Colors.grey[600]),
                                ),
                                const SizedBox(height: AppTheme.spacingL),
                                OutlinedButton.icon(
                                  onPressed: () => _showJoinWaitingListDialog(bookingProvider),
                                  icon: const Icon(Icons.schedule),
                                  label: const Text('Join Waiting List'),
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
                                  'Get notified when a slot opens up',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: Colors.grey[500],
                                      ),
                                ),
                              ],
                            ),
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppTheme.spacingM,
                                ),
                                child: Text(
                                  '${bookingProvider.availableSlots!.availableSlots} slots available',
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
                                  gridDelegate:
                                      const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 4,
                                    childAspectRatio: 2.2,
                                    crossAxisSpacing: 8,
                                    mainAxisSpacing: 8,
                                  ),
                                  itemCount:
                                      bookingProvider.availableSlots!.slots.length,
                                  itemBuilder: (context, index) {
                                    final slot =
                                        bookingProvider.availableSlots!.slots[index];
                                    final isSelected =
                                        bookingProvider.selectedTimeSlot == slot.time;
                                    final isAvailable = slot.available;

                                    return GestureDetector(
                                      onTap: isAvailable
                                          ? () =>
                                              bookingProvider.selectTimeSlot(slot.time)
                                          : null,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? AppTheme.primaryColor
                                              : isAvailable
                                                  ? Colors.white
                                                  : Colors.grey[200],
                                          borderRadius:
                                              BorderRadius.circular(AppTheme.radiusS),
                                          border: Border.all(
                                            color: isSelected
                                                ? AppTheme.primaryColor
                                                : isAvailable
                                                    ? AppTheme.primaryColor
                                                        .withValues(alpha: 0.3)
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
                          ),
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
                        decoration: const InputDecoration(
                          hintText: 'Add notes (optional)',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(
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
                              ? _confirmBooking
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
                              : const Text(
                                  'Book Appointment',
                                  style: TextStyle(
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

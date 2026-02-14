import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../models/waiting_list.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/modern_card.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/error_view.dart';

class AdminWaitingListScreen extends StatefulWidget {
  const AdminWaitingListScreen({super.key});

  @override
  State<AdminWaitingListScreen> createState() => _AdminWaitingListScreenState();
}

class _AdminWaitingListScreenState extends State<AdminWaitingListScreen> {
  final ApiService _apiService = ApiService();
  List<WaitingListEntry> _entries = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadEntries();
  }

  Future<void> _loadEntries() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final entries = await _apiService.getAllWaitingList();
      setState(() {
        _entries = entries;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'waiting':
        return Colors.orange;
      case 'contacted':
        return Colors.blue;
      case 'scheduled':
        return AppTheme.successColor;
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'waiting':
        return Icons.hourglass_empty;
      case 'contacted':
        return Icons.phone_callback;
      case 'scheduled':
        return Icons.event_available;
      case 'cancelled':
        return Icons.event_busy;
      default:
        return Icons.help_outline;
    }
  }

  Future<void> _updateStatus(WaitingListEntry entry, String newStatus) async {
    try {
      await _apiService.updateWaitingListEntry(
        entryId: entry.id,
        status: newStatus,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text('Status updated to ${newStatus.toUpperCase()}'),
            ],
          ),
          backgroundColor: AppTheme.successColor,
        ),
      );
      _loadEntries();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Future<void> _deleteEntry(WaitingListEntry entry) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove from Waiting List'),
        content: Text('Remove ${entry.patientName ?? 'this patient'} from the waiting list?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.errorColor),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _apiService.deleteWaitingListEntry(entry.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white, size: 20),
              SizedBox(width: 8),
              Text('Entry removed from waiting list'),
            ],
          ),
          backgroundColor: AppTheme.successColor,
        ),
      );
      _loadEntries();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showStatusOptions(WaitingListEntry entry) {
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
              'Update Status',
              style: Theme.of(ctx).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingS),
            Text(
              entry.patientName ?? 'Patient',
              style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingL),
            _StatusOption(
              icon: Icons.hourglass_empty,
              label: 'Waiting',
              color: Colors.orange,
              isSelected: entry.status == 'waiting',
              onTap: () {
                Navigator.pop(ctx);
                _updateStatus(entry, 'waiting');
              },
            ),
            _StatusOption(
              icon: Icons.phone_callback,
              label: 'Contacted',
              color: Colors.blue,
              isSelected: entry.status == 'contacted',
              onTap: () {
                Navigator.pop(ctx);
                _updateStatus(entry, 'contacted');
              },
            ),
            _StatusOption(
              icon: Icons.event_available,
              label: 'Scheduled',
              color: AppTheme.successColor,
              isSelected: entry.status == 'scheduled',
              onTap: () {
                Navigator.pop(ctx);
                _updateStatus(entry, 'scheduled');
              },
            ),
            _StatusOption(
              icon: Icons.event_busy,
              label: 'Cancelled',
              color: AppTheme.errorColor,
              isSelected: entry.status == 'cancelled',
              onTap: () {
                Navigator.pop(ctx);
                _updateStatus(entry, 'cancelled');
              },
            ),
            const SizedBox(height: AppTheme.spacingM),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  _deleteEntry(entry);
                },
                icon: const Icon(Icons.delete_outline, color: AppTheme.errorColor),
                label: const Text('Remove from List'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.errorColor,
                  side: const BorderSide(color: AppTheme.errorColor),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingS),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.all(AppTheme.spacingM),
        child: ShimmerList(itemCount: 5, itemHeight: 120),
      );
    }

    if (_errorMessage != null) {
      return ErrorView(
        message: _errorMessage!,
        onRetry: _loadEntries,
      );
    }

    if (_entries.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingL),
              decoration: BoxDecoration(
                color: AppTheme.surfaceMedium,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.hourglass_empty,
                size: 48,
                color: AppTheme.textHint,
              ),
            ),
            const SizedBox(height: AppTheme.spacingM),
            Text(
              'Waiting list is empty',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingS),
            Text(
              'New waiting list entries will appear here',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textHint,
                  ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadEntries,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppTheme.spacingM),
        itemCount: _entries.length,
        itemBuilder: (context, index) {
          final entry = _entries[index];
          final statusColor = _getStatusColor(entry.status);
          final dateFormat = DateFormat('MMM d, yyyy');

          return ModernCard(
            margin: const EdgeInsets.only(bottom: AppTheme.spacingM),
            onTap: () => _showStatusOptions(entry),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with patient name and status
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(AppTheme.radiusS),
                      ),
                      child: Icon(
                        _getStatusIcon(entry.status),
                        color: statusColor,
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacingM),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            entry.patientName ?? 'Unknown Patient',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            entry.serviceType,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppTheme.textSecondary,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(AppTheme.radiusRound),
                        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        entry.status.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppTheme.spacingM),
                // Details
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacingM),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceLight,
                    borderRadius: BorderRadius.circular(AppTheme.radiusS),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.medical_services_outlined, size: 16, color: AppTheme.textSecondary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Doctor: ${entry.doctorName ?? 'Not assigned'}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 16, color: AppTheme.textSecondary),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Preferred: ${dateFormat.format(entry.preferredDate)}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                      if (entry.priority != null) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.flag, size: 16, color: AppTheme.textSecondary),
                            const SizedBox(width: 8),
                            Text(
                              'Priority: ${entry.priority}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ],
                      if (entry.notes != null && entry.notes!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.notes, size: 16, color: AppTheme.textSecondary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                entry.notes!,
                                style: Theme.of(context).textTheme.bodySmall,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: AppTheme.spacingM),
                // Quick actions
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _updateStatus(entry, 'contacted'),
                        icon: const Icon(Icons.phone, size: 18),
                        label: const Text('Contact'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.blue,
                          side: BorderSide(color: Colors.blue.withValues(alpha: 0.5)),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacingS),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _updateStatus(entry, 'scheduled'),
                        icon: const Icon(Icons.event_available, size: 18),
                        label: const Text('Schedule'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.successColor,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatusOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;

  const _StatusOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(label),
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: AppTheme.successColor)
          : const Icon(Icons.circle_outlined, color: AppTheme.textHint),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        side: BorderSide(
          color: isSelected ? color : AppTheme.dividerColor,
          width: isSelected ? 2 : 1,
        ),
      ),
      tileColor: isSelected ? color.withValues(alpha: 0.05) : null,
    );
  }
}

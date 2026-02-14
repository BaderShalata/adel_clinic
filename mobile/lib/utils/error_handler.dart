import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Utility class for handling errors in a user-friendly way
class ErrorHandler {
  /// Convert technical error messages to user-friendly messages
  static String getFriendlyMessage(dynamic error) {
    final errorStr = error.toString().toLowerCase();

    // Network errors
    if (errorStr.contains('socketexception') ||
        errorStr.contains('connection refused') ||
        errorStr.contains('network is unreachable')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    if (errorStr.contains('timeout') || errorStr.contains('timed out')) {
      return 'The request took too long. Please try again.';
    }

    // Authentication errors
    if (errorStr.contains('unauthorized') || errorStr.contains('401')) {
      return 'Your session has expired. Please sign in again.';
    }

    if (errorStr.contains('forbidden') || errorStr.contains('403')) {
      return 'You don\'t have permission to perform this action.';
    }

    // Not found errors
    if (errorStr.contains('not found') || errorStr.contains('404')) {
      return 'The requested item was not found.';
    }

    // Validation errors
    if (errorStr.contains('already exists')) {
      return 'This item already exists. Please use a different name.';
    }

    if (errorStr.contains('invalid') || errorStr.contains('validation')) {
      // Return the original message if it's a validation error
      return _cleanErrorMessage(error.toString());
    }

    // Server errors
    if (errorStr.contains('500') || errorStr.contains('internal server')) {
      return 'Something went wrong on our end. Please try again later.';
    }

    if (errorStr.contains('503') || errorStr.contains('service unavailable')) {
      return 'The service is temporarily unavailable. Please try again later.';
    }

    // Slot/Appointment errors
    if (errorStr.contains('slot') && errorStr.contains('available')) {
      return 'This time slot is no longer available. Please select another time.';
    }

    if (errorStr.contains('already booked') || errorStr.contains('double booking')) {
      return 'This time slot is already booked. Please choose a different time.';
    }

    // Default: clean up the error message
    return _cleanErrorMessage(error.toString());
  }

  /// Remove technical prefixes from error messages
  static String _cleanErrorMessage(String message) {
    return message
        .replaceAll('Exception: ', '')
        .replaceAll('Error: ', '')
        .replaceAll('Failed to ', 'Could not ')
        .trim();
  }

  /// Show a user-friendly error snackbar
  static void showError(BuildContext context, dynamic error, {String? action, VoidCallback? onAction}) {
    final message = getFriendlyMessage(error);

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.errorColor,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
        action: action != null && onAction != null
            ? SnackBarAction(
                label: action,
                textColor: Colors.white,
                onPressed: onAction,
              )
            : null,
      ),
    );
  }

  /// Show a success snackbar
  static void showSuccess(BuildContext context, String message) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.successColor,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  /// Show a warning snackbar
  static void showWarning(BuildContext context, String message) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.warningColor,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  /// Show a loading snackbar (returns the ScaffoldMessengerState to allow hiding later)
  static ScaffoldFeatureController<SnackBar, SnackBarClosedReason> showLoading(
    BuildContext context,
    String message,
  ) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    return ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              message,
              style: const TextStyle(color: Colors.white),
            ),
          ],
        ),
        backgroundColor: AppTheme.primaryColor,
        duration: const Duration(seconds: 30),
      ),
    );
  }

  /// Show an info snackbar
  static void showInfo(BuildContext context, String message) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.info_outline, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.primaryColor,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}

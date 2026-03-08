import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';
import 'storage_service.dart';

/// Top-level background message handler (required by FCM)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background messages are handled by the OS notification tray automatically
  print('Background message received: ${message.messageId}');
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  /// Register background handler — call BEFORE Firebase.initializeApp()
  static void registerBackgroundHandler() {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  }

  /// Initialize notification channels and foreground listener
  Future<void> initialize() async {
    // Android notification channel
    const androidChannel = AndroidNotificationChannel(
      'appointment_notifications',
      'Appointment Notifications',
      description: 'Notifications for appointment status changes and reminders',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    // Initialize local notifications
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(initSettings);

    // Handle foreground messages — show as local notification
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
  }

  /// Request notification permission from the OS
  Future<bool> requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  /// Register FCM token for the current user and send to backend
  Future<void> registerTokenForCurrentUser() async {
    try {
      // Request permission first
      final granted = await requestPermission();
      if (!granted) {
        print('Notification permission not granted');
        return;
      }

      // Get FCM token
      final token = await _messaging.getToken();
      if (token == null) {
        print('Failed to get FCM token');
        return;
      }

      // Get current locale
      final locale = StorageService().getString('language') ?? 'he';

      // Send to backend
      await ApiService().updateFcmToken(token, locale);
      print('FCM token registered successfully');

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) {
        final currentLocale = StorageService().getString('language') ?? 'he';
        ApiService().updateFcmToken(newToken, currentLocale);
      });
    } catch (e) {
      print('Failed to register FCM token: $e');
    }
  }

  /// Show foreground notification as a local notification banner
  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'appointment_notifications',
          'Appointment Notifications',
          channelDescription:
              'Notifications for appointment status changes and reminders',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }
}

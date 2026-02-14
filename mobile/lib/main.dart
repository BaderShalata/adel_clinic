import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'providers/auth_provider.dart' as app_auth;
import 'providers/doctor_provider.dart';
import 'providers/news_provider.dart';
import 'providers/appointment_provider.dart';
import 'providers/booking_provider.dart';
import 'services/api_service.dart';
import 'services/storage_service.dart';
import 'screens/shell/main_shell.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Sign out user on app start (fresh session each time)
  await FirebaseAuth.instance.signOut();

  // Initialize services
  await StorageService().init();
  ApiService().init();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => app_auth.AuthProvider()),
        ChangeNotifierProvider(create: (_) => DoctorProvider()),
        ChangeNotifierProvider(create: (_) => NewsProvider()),
        ChangeNotifierProvider(create: (_) => AppointmentProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
      ],
      child: MaterialApp(
        title: 'Adel Clinic',
        theme: AppTheme.lightTheme,
        home: const MainShell(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

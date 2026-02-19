import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class LanguageProvider extends ChangeNotifier {
  Locale _locale = const Locale('en');

  Locale get locale => _locale;

  String get languageCode => _locale.languageCode;

  bool get isRTL => _locale.languageCode == 'ar' || _locale.languageCode == 'he';

  TextDirection get textDirection => isRTL ? TextDirection.rtl : TextDirection.ltr;

  LanguageProvider() {
    _loadSavedLanguage();
  }

  Future<void> _loadSavedLanguage() async {
    final savedLang = StorageService().getString('language');
    if (savedLang != null) {
      _locale = Locale(savedLang);
      notifyListeners();
    }
  }

  Future<void> setLocale(Locale locale) async {
    if (_locale == locale) return;
    _locale = locale;
    await StorageService().setString('language', locale.languageCode);
    notifyListeners();
  }

  Future<void> setLanguage(String languageCode) async {
    await setLocale(Locale(languageCode));
  }

  String t(String key) {
    return _translations[key]?[languageCode] ??
           _translations[key]?['en'] ??
           key;
  }

  // Translations map
  static const Map<String, Map<String, String>> _translations = {
    // App general
    'appName': {'en': 'Adel Clinic', 'ar': 'عيادة عادل', 'he': 'מרפאת עאדל'},
    'welcome': {'en': 'Welcome', 'ar': 'مرحباً', 'he': 'ברוכים הבאים'},
    'welcomeBack': {'en': 'Welcome back', 'ar': 'مرحباً بعودتك', 'he': 'ברוך שובך'},
    'yourHealthOurPriority': {'en': 'Your Health, Our Priority', 'ar': 'صحتك، أولويتنا', 'he': 'הבריאות שלך, העדיפות שלנו'},

    // Navigation
    'home': {'en': 'Home', 'ar': 'الرئيسية', 'he': 'בית'},
    'appointments': {'en': 'Appointments', 'ar': 'المواعيد', 'he': 'פגישות'},
    'doctors': {'en': 'Doctors', 'ar': 'الأطباء', 'he': 'רופאים'},
    'profile': {'en': 'Profile', 'ar': 'الملف الشخصي', 'he': 'פרופיל'},

    // Actions
    'findDoctor': {'en': 'Find Doctor', 'ar': 'البحث عن طبيب', 'he': 'מצא רופא'},
    'bookAppointment': {'en': 'Book Appointment', 'ar': 'حجز موعد', 'he': 'קבע תור'},
    'login': {'en': 'Login', 'ar': 'تسجيل الدخول', 'he': 'התחברות'},
    'logout': {'en': 'Logout', 'ar': 'تسجيل الخروج', 'he': 'התנתקות'},
    'signIn': {'en': 'Sign In', 'ar': 'تسجيل الدخول', 'he': 'התחבר'},
    'signUp': {'en': 'Sign Up', 'ar': 'إنشاء حساب', 'he': 'הרשמה'},
    'register': {'en': 'Register', 'ar': 'التسجيل', 'he': 'הרשמה'},
    'cancel': {'en': 'Cancel', 'ar': 'إلغاء', 'he': 'ביטול'},
    'confirm': {'en': 'Confirm', 'ar': 'تأكيد', 'he': 'אישור'},
    'save': {'en': 'Save', 'ar': 'حفظ', 'he': 'שמור'},
    'delete': {'en': 'Delete', 'ar': 'حذف', 'he': 'מחק'},
    'edit': {'en': 'Edit', 'ar': 'تعديل', 'he': 'ערוך'},
    'retry': {'en': 'Retry', 'ar': 'إعادة المحاولة', 'he': 'נסה שוב'},

    // Auth
    'email': {'en': 'Email', 'ar': 'البريد الإلكتروني', 'he': 'אימייל'},
    'password': {'en': 'Password', 'ar': 'كلمة المرور', 'he': 'סיסמה'},
    'confirmPassword': {'en': 'Confirm Password', 'ar': 'تأكيد كلمة المرور', 'he': 'אימות סיסמה'},
    'fullName': {'en': 'Full Name', 'ar': 'الاسم الكامل', 'he': 'שם מלא'},
    'phoneNumber': {'en': 'Phone Number', 'ar': 'رقم الهاتف', 'he': 'מספר טלפון'},
    'dateOfBirth': {'en': 'Date of Birth', 'ar': 'تاريخ الميلاد', 'he': 'תאריך לידה'},
    'gender': {'en': 'Gender', 'ar': 'الجنس', 'he': 'מגדר'},
    'male': {'en': 'Male', 'ar': 'ذكر', 'he': 'זכר'},
    'female': {'en': 'Female', 'ar': 'أنثى', 'he': 'נקבה'},
    'forgotPassword': {'en': 'Forgot Password?', 'ar': 'نسيت كلمة المرور؟', 'he': 'שכחת סיסמה?'},
    'dontHaveAccount': {'en': "Don't have an account?", 'ar': 'ليس لديك حساب؟', 'he': 'אין לך חשבון?'},
    'alreadyHaveAccount': {'en': 'Already have an account?', 'ar': 'لديك حساب بالفعل؟', 'he': 'כבר יש לך חשבון?'},
    'signInRequired': {'en': 'Sign In Required', 'ar': 'يجب تسجيل الدخول', 'he': 'נדרשת התחברות'},
    'pleaseSignInToBook': {'en': 'Please sign in to book an appointment. Your booking will be saved to your account.', 'ar': 'يرجى تسجيل الدخول لحجز موعد. سيتم حفظ حجزك في حسابك.', 'he': 'אנא התחבר כדי לקבוע תור. ההזמנה תישמר בחשבונך.'},

    // Booking
    'selectService': {'en': 'Select Service', 'ar': 'اختر الخدمة', 'he': 'בחר שירות'},
    'selectDoctor': {'en': 'Select Doctor', 'ar': 'اختر الطبيب', 'he': 'בחר רופא'},
    'selectTime': {'en': 'Select Time', 'ar': 'اختر الوقت', 'he': 'בחר שעה'},
    'confirmBooking': {'en': 'Confirm Booking', 'ar': 'تأكيد الحجز', 'he': 'אשר הזמנה'},
    'service': {'en': 'Service', 'ar': 'الخدمة', 'he': 'שירות'},
    'doctor': {'en': 'Doctor', 'ar': 'الطبيب', 'he': 'רופא'},
    'date': {'en': 'Date', 'ar': 'التاريخ', 'he': 'תאריך'},
    'time': {'en': 'Time', 'ar': 'الوقت', 'he': 'שעה'},
    'notes': {'en': 'Notes', 'ar': 'ملاحظات', 'he': 'הערות'},
    'addNotes': {'en': 'Add notes (optional)', 'ar': 'إضافة ملاحظات (اختياري)', 'he': 'הוסף הערות (אופציונלי)'},
    'slotsAvailable': {'en': 'slots available', 'ar': 'مواعيد متاحة', 'he': 'תורים פנויים'},
    'noSlotsAvailable': {'en': 'No slots available', 'ar': 'لا توجد مواعيد متاحة', 'he': 'אין תורים פנויים'},
    'doctorNotAvailable': {'en': 'Doctor is not available on this day', 'ar': 'الطبيب غير متاح في هذا اليوم', 'he': 'הרופא לא זמין ביום זה'},
    'allSlotsBooked': {'en': 'All slots are booked for this day', 'ar': 'جميع المواعيد محجوزة لهذا اليوم', 'he': 'כל התורים תפוסים ליום זה'},
    'joinWaitingList': {'en': 'Join Waiting List', 'ar': 'الانضمام لقائمة الانتظار', 'he': 'הצטרף לרשימת המתנה'},
    'getNotified': {'en': 'Get notified when a slot opens up', 'ar': 'سيتم إخطارك عند توفر موعد', 'he': 'קבל התראה כשיתפנה תור'},
    'appointmentBooked': {'en': 'Appointment request submitted! Awaiting clinic confirmation.', 'ar': 'تم إرسال طلب الموعد! في انتظار تأكيد العيادة.', 'he': 'בקשת התור נשלחה! ממתין לאישור המרפאה.'},
    'addedToWaitingList': {'en': "Added to waiting list! We'll notify you when a slot opens.", 'ar': 'تمت إضافتك لقائمة الانتظار! سنخطرك عند توفر موعد.', 'he': 'נוספת לרשימת ההמתנה! נודיע לך כשיתפנה תור.'},

    // Appointments status
    'pending': {'en': 'Pending', 'ar': 'قيد الانتظار', 'he': 'ממתין'},
    'confirmed': {'en': 'Confirmed', 'ar': 'مؤكد', 'he': 'מאושר'},
    'completed': {'en': 'Completed', 'ar': 'مكتمل', 'he': 'הושלם'},
    'cancelled': {'en': 'Cancelled', 'ar': 'ملغى', 'he': 'בוטל'},
    'noShow': {'en': 'No Show', 'ar': 'لم يحضر', 'he': 'לא הגיע'},

    // Appointments
    'myAppointments': {'en': 'My Appointments', 'ar': 'مواعيدي', 'he': 'התורים שלי'},
    'upcomingAppointments': {'en': 'Upcoming Appointments', 'ar': 'المواعيد القادمة', 'he': 'תורים קרובים'},
    'pastAppointments': {'en': 'Past Appointments', 'ar': 'المواعيد السابقة', 'he': 'תורים קודמים'},
    'noAppointments': {'en': 'No appointments', 'ar': 'لا توجد مواعيد', 'he': 'אין תורים'},
    'noUpcomingAppointments': {'en': 'No upcoming appointments', 'ar': 'لا توجد مواعيد قادمة', 'he': 'אין תורים קרובים'},
    'cancelAppointment': {'en': 'Cancel Appointment', 'ar': 'إلغاء الموعد', 'he': 'בטל תור'},
    'appointmentCancelled': {'en': 'Appointment cancelled', 'ar': 'تم إلغاء الموعد', 'he': 'התור בוטל'},

    // Doctors
    'ourDoctors': {'en': 'Our Doctors', 'ar': 'أطباؤنا', 'he': 'הרופאים שלנו'},
    'specialties': {'en': 'Specialties', 'ar': 'التخصصات', 'he': 'התמחויות'},
    'qualifications': {'en': 'Qualifications', 'ar': 'المؤهلات', 'he': 'כישורים'},
    'aboutDoctor': {'en': 'About Doctor', 'ar': 'عن الطبيب', 'he': 'אודות הרופא'},
    'bookWithDoctor': {'en': 'Book with this Doctor', 'ar': 'احجز مع هذا الطبيب', 'he': 'קבע תור עם רופא זה'},
    'noDoctorsAvailable': {'en': 'No doctors available', 'ar': 'لا يوجد أطباء متاحين', 'he': 'אין רופאים זמינים'},
    'noDoctorsForService': {'en': 'No doctors available for this service', 'ar': 'لا يوجد أطباء متاحين لهذه الخدمة', 'he': 'אין רופאים זמינים לשירות זה'},

    // News
    'latestNews': {'en': 'Latest News', 'ar': 'آخر الأخبار', 'he': 'חדשות אחרונות'},
    'noNews': {'en': 'No news available', 'ar': 'لا توجد أخبار', 'he': 'אין חדשות'},
    'healthTip': {'en': 'Health Tip', 'ar': 'نصيحة صحية', 'he': 'טיפ בריאותי'},
    'announcement': {'en': 'Announcement', 'ar': 'إعلان', 'he': 'הודעה'},
    'event': {'en': 'Event', 'ar': 'فعالية', 'he': 'אירוע'},

    // Profile
    'myProfile': {'en': 'My Profile', 'ar': 'ملفي الشخصي', 'he': 'הפרופיל שלי'},
    'editProfile': {'en': 'Edit Profile', 'ar': 'تعديل الملف الشخصي', 'he': 'ערוך פרופיל'},
    'settings': {'en': 'Settings', 'ar': 'الإعدادات', 'he': 'הגדרות'},
    'language': {'en': 'Language', 'ar': 'اللغة', 'he': 'שפה'},
    'english': {'en': 'English', 'ar': 'الإنجليزية', 'he': 'אנגלית'},
    'arabic': {'en': 'Arabic', 'ar': 'العربية', 'he': 'ערבית'},
    'hebrew': {'en': 'Hebrew', 'ar': 'العبرية', 'he': 'עברית'},

    // Location & Social
    'location': {'en': 'Location', 'ar': 'الموقع', 'he': 'מיקום'},
    'tapToOpen': {'en': 'Tap to open', 'ar': 'انقر للفتح', 'he': 'לחץ לפתיחה'},
    'followUs': {'en': 'Follow Us', 'ar': 'تابعنا', 'he': 'עקבו אחרינו'},
    'openWith': {'en': 'Open with', 'ar': 'فتح باستخدام', 'he': 'פתח עם'},
    'googleMaps': {'en': 'Google Maps', 'ar': 'خرائط جوجل', 'he': 'Google Maps'},
    'waze': {'en': 'Waze', 'ar': 'ويز', 'he': 'Waze'},

    // Errors
    'error': {'en': 'Error', 'ar': 'خطأ', 'he': 'שגיאה'},
    'errorOccurred': {'en': 'An error occurred', 'ar': 'حدث خطأ', 'he': 'אירעה שגיאה'},
    'errorLoadingDoctors': {'en': 'Error loading doctors', 'ar': 'خطأ في تحميل الأطباء', 'he': 'שגיאה בטעינת רופאים'},
    'pleaseLoginToBook': {'en': 'Please log in to book an appointment', 'ar': 'يرجى تسجيل الدخول لحجز موعد', 'he': 'אנא התחבר כדי לקבוע תור'},
    'pleaseSelectTimeSlot': {'en': 'Please select a time slot', 'ar': 'يرجى اختيار موعد', 'he': 'אנא בחר שעה'},
    'couldNotOpen': {'en': 'Could not open', 'ar': 'تعذر الفتح', 'he': 'לא ניתן לפתוח'},
    'couldNotOpenMaps': {'en': 'Could not open maps', 'ar': 'تعذر فتح الخرائط', 'he': 'לא ניתן לפתוח מפות'},
    'failedToBook': {'en': 'Failed to book appointment', 'ar': 'فشل في حجز الموعد', 'he': 'הזמנת התור נכשלה'},
    'failedToJoinWaitingList': {'en': 'Failed to join waiting list', 'ar': 'فشل في الانضمام لقائمة الانتظار', 'he': 'ההצטרפות לרשימת ההמתנה נכשלה'},

    // Misc
    'loading': {'en': 'Loading...', 'ar': 'جاري التحميل...', 'he': 'טוען...'},
    'noData': {'en': 'No data available', 'ar': 'لا توجد بيانات', 'he': 'אין נתונים'},
    'or': {'en': 'or', 'ar': 'أو', 'he': 'או'},
    'and': {'en': 'and', 'ar': 'و', 'he': 'ו'},
    'yes': {'en': 'Yes', 'ar': 'نعم', 'he': 'כן'},
    'no': {'en': 'No', 'ar': 'لا', 'he': 'לא'},
    'ok': {'en': 'OK', 'ar': 'حسناً', 'he': 'אישור'},
    'close': {'en': 'Close', 'ar': 'إغلاق', 'he': 'סגור'},
    'patient': {'en': 'Patient', 'ar': 'مريض', 'he': 'מטופל'},
  };
}

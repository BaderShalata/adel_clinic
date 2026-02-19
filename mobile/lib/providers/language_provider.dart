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
    'idNumber': {'en': 'ID Number', 'ar': 'رقم الهوية', 'he': 'מספר תעודת זהות'},
    'dateOfBirth': {'en': 'Date of Birth', 'ar': 'تاريخ الميلاد', 'he': 'תאריך לידה'},
    'gender': {'en': 'Gender', 'ar': 'الجنس', 'he': 'מגדר'},
    'male': {'en': 'Male', 'ar': 'ذكر', 'he': 'זכר'},
    'female': {'en': 'Female', 'ar': 'أنثى', 'he': 'נקבה'},
    'selectGender': {'en': 'Select Gender', 'ar': 'اختر الجنس', 'he': 'בחר מגדר'},
    'forgotPassword': {'en': 'Forgot Password?', 'ar': 'نسيت كلمة المرور؟', 'he': 'שכחת סיסמה?'},
    'dontHaveAccount': {'en': "Don't have an account? ", 'ar': 'ليس لديك حساب؟ ', 'he': 'אין לך חשבון? '},
    'alreadyHaveAccount': {'en': 'Already have an account? ', 'ar': 'لديك حساب بالفعل؟ ', 'he': 'כבר יש לך חשבון? '},
    'signInRequired': {'en': 'Sign In Required', 'ar': 'يجب تسجيل الدخول', 'he': 'נדרשת התחברות'},
    'pleaseSignInToBook': {'en': 'Please sign in to book an appointment. Your booking will be saved to your account.', 'ar': 'يرجى تسجيل الدخول لحجز موعد. سيتم حفظ حجزك في حسابك.', 'he': 'אנא התחבר כדי לקבוע תור. ההזמנה תישמר בחשבונך.'},
    'signInSubtitle': {'en': 'Sign in to book appointments and manage your health', 'ar': 'سجل دخولك لحجز المواعيد وإدارة صحتك', 'he': 'התחבר כדי לקבוע תורים ולנהל את הבריאות שלך'},
    'createAccountSubtitle': {'en': 'Create an account to book appointments', 'ar': 'أنشئ حساباً لحجز المواعيد', 'he': 'צור חשבון כדי לקבוע תורים'},
    'pleaseEnterEmail': {'en': 'Please enter your email', 'ar': 'يرجى إدخال بريدك الإلكتروني', 'he': 'אנא הזן את האימייל שלך'},
    'pleaseEnterPassword': {'en': 'Please enter your password', 'ar': 'يرجى إدخال كلمة المرور', 'he': 'אנא הזן את הסיסמה שלך'},
    'pleaseEnterName': {'en': 'Please enter your name', 'ar': 'يرجى إدخال اسمك', 'he': 'אנא הזן את שמך'},
    'pleaseEnterPhone': {'en': 'Please enter your phone number', 'ar': 'يرجى إدخال رقم هاتفك', 'he': 'אנא הזן את מספר הטלפון שלך'},
    'pleaseEnterIdNumber': {'en': 'Please enter your ID number', 'ar': 'يرجى إدخال رقم هويتك', 'he': 'אנא הזן את מספר תעודת הזהות שלך'},
    'passwordMinLength': {'en': 'Password must be at least 6 characters', 'ar': 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل', 'he': 'הסיסמה חייבת להכיל לפחות 6 תווים'},
    'passwordsDoNotMatch': {'en': 'Passwords do not match', 'ar': 'كلمتا المرور غير متطابقتين', 'he': 'הסיסמאות אינן תואמות'},
    'createAccount': {'en': 'Create Account', 'ar': 'إنشاء حساب', 'he': 'צור חשבון'},

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
    'doctorDetails': {'en': 'Doctor Details', 'ar': 'تفاصيل الطبيب', 'he': 'פרטי הרופא'},
    'specialties': {'en': 'Specialties', 'ar': 'التخصصات', 'he': 'התמחויות'},
    'qualifications': {'en': 'Qualifications', 'ar': 'المؤهلات', 'he': 'כישורים'},
    'about': {'en': 'About', 'ar': 'نبذة', 'he': 'אודות'},
    'aboutDoctor': {'en': 'About Doctor', 'ar': 'عن الطبيب', 'he': 'אודות הרופא'},
    'weeklySchedule': {'en': 'Weekly Schedule', 'ar': 'الجدول الأسبوعي', 'he': 'לוח זמנים שבועי'},
    'noScheduleAvailable': {'en': 'No schedule available', 'ar': 'لا يوجد جدول متاح', 'he': 'אין לוח זמנים זמין'},
    'services': {'en': 'Services', 'ar': 'الخدمات', 'he': 'שירותים'},
    'chooseConsultationType': {'en': 'Choose the type of consultation', 'ar': 'اختر نوع الاستشارة', 'he': 'בחר את סוג הייעוץ'},
    'noServicesForDoctor': {'en': 'No services available for this doctor', 'ar': 'لا توجد خدمات متاحة لهذا الطبيب', 'he': 'אין שירותים זמינים לרופא זה'},
    'bookWithDoctor': {'en': 'Book with this Doctor', 'ar': 'احجز مع هذا الطبيب', 'he': 'קבע תור עם רופא זה'},
    'noDoctorsAvailable': {'en': 'No doctors available', 'ar': 'لا يوجد أطباء متاحين', 'he': 'אין רופאים זמינים'},
    'noDoctorsForService': {'en': 'No doctors available for this service', 'ar': 'لا يوجد أطباء متاحين لهذه الخدمة', 'he': 'אין רופאים זמינים לשירות זה'},
    'searchDoctors': {'en': 'Search doctors or specialties...', 'ar': 'البحث عن أطباء أو تخصصات...', 'he': 'חפש רופאים או התמחויות...'},
    'addDoctor': {'en': 'Add Doctor', 'ar': 'إضافة طبيب', 'he': 'הוסף רופא'},
    'noDoctorsFound': {'en': 'No doctors found', 'ar': 'لم يتم العثور على أطباء', 'he': 'לא נמצאו רופאים'},

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
    'visitUs': {'en': 'Visit Us', 'ar': 'زيارتنا', 'he': 'בקרו אותנו'},
    'clinicName': {'en': 'Saba Reihana Medical Center', 'ar': 'مركز صبا ريحانة الطبي', 'he': 'מרכז רפואי סבא ריחאנה'},
    'address': {'en': 'Address', 'ar': 'العنوان', 'he': 'כתובת'},
    'clinicAddress': {'en': 'Sakhnin', 'ar': 'سخنين، المنطقة الصناعية', 'he': 'סח\'נין, אזור התעשייה'},
    'workingHours': {'en': 'Working Hours', 'ar': 'ساعات العمل', 'he': 'שעות פעילות'},
    'workingHoursValue': {'en': 'Sun-Thu: 8AM-8PM, Fri: 8AM-2PM', 'ar': 'أحد-خميس: 8ص-8م، جمعة: 8ص-2م', 'he': 'א\'-ה\': 8:00-20:00, ו\': 8:00-14:00'},
    'phone': {'en': 'Phone', 'ar': 'الهاتف', 'he': 'טלפון'},
    'getDirections': {'en': 'Directions', 'ar': 'الاتجاهات', 'he': 'הוראות הגעה'},
    'whatsapp': {'en': 'WhatsApp', 'ar': 'واتساب', 'he': 'WhatsApp'},
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

    // Auth Errors
    'loginFailed': {'en': 'Login failed. Please try again.', 'ar': 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.', 'he': 'ההתחברות נכשלה. נסה שוב.'},
    'invalidEmail': {'en': 'Please enter a valid email address.', 'ar': 'يرجى إدخال بريد إلكتروني صالح.', 'he': 'אנא הזן כתובת אימייל תקינה.'},
    'userNotFound': {'en': 'No account found with this email. Please register first.', 'ar': 'لا يوجد حساب بهذا البريد الإلكتروني. يرجى التسجيل أولاً.', 'he': 'לא נמצא חשבון עם אימייל זה. אנא הירשם תחילה.'},
    'wrongPassword': {'en': 'Incorrect password. Please try again.', 'ar': 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.', 'he': 'סיסמה שגויה. נסה שוב.'},
    'emailAlreadyInUse': {'en': 'An account with this email already exists. Please login instead.', 'ar': 'يوجد حساب بهذا البريد الإلكتروني. يرجى تسجيل الدخول بدلاً من ذلك.', 'he': 'כבר קיים חשבון עם אימייל זה. אנא התחבר במקום.'},
    'weakPassword': {'en': 'Password is too weak. Use at least 6 characters.', 'ar': 'كلمة المرور ضعيفة جداً. استخدم 6 أحرف على الأقل.', 'he': 'הסיסמה חלשה מדי. השתמש ב-6 תווים לפחות.'},
    'tooManyRequests': {'en': 'Too many attempts. Please wait a moment and try again.', 'ar': 'محاولات كثيرة جداً. يرجى الانتظار لحظة والمحاولة مرة أخرى.', 'he': 'יותר מדי ניסיונות. המתן רגע ונסה שוב.'},
    'userDisabled': {'en': 'This account has been disabled. Please contact support.', 'ar': 'تم تعطيل هذا الحساب. يرجى الاتصال بالدعم.', 'he': 'חשבון זה הושבת. אנא פנה לתמיכה.'},
    'networkError': {'en': 'Network error. Please check your internet connection.', 'ar': 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.', 'he': 'שגיאת רשת. אנא בדוק את חיבור האינטרנט שלך.'},
    'registrationFailed': {'en': 'Registration failed. Please try again.', 'ar': 'فشل التسجيل. يرجى المحاولة مرة أخرى.', 'he': 'ההרשמה נכשלה. נסה שוב.'},
    'operationNotAllowed': {'en': 'This operation is not allowed. Please contact support.', 'ar': 'هذه العملية غير مسموح بها. يرجى الاتصال بالدعم.', 'he': 'פעולה זו אינה מותרת. אנא פנה לתמיכה.'},
    'invalidCredential': {'en': 'Invalid login credentials. Please check your email and password.', 'ar': 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.', 'he': 'פרטי התחברות שגויים. אנא בדוק את האימייל והסיסמה.'},

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

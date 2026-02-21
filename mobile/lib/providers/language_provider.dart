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
    'appName': {'en': 'SBA REHANA', 'ar': 'صبا ريحانة', 'he': 'סבא ריחאנה'},
    'welcome': {'en': 'Welcome', 'ar': 'مرحباً', 'he': 'ברוכים הבאים'},
    'welcomeBack': {'en': 'Welcome back', 'ar': 'مرحباً بعودتك', 'he': 'ברוך שובך'},
    'yourHealthOurPriority': {'en': 'Your Health, Our Priority', 'ar': 'صحتك، أولويتنا', 'he': 'הבריאות שלך, העדיפות שלנו'},

    // Navigation
    'home': {'en': 'Home', 'ar': 'الرئيسية', 'he': 'בית'},
    'appointments': {'en': 'Appointments', 'ar': 'المواعيد', 'he': 'פגישות'},
    'doctors': {'en': 'Doctors', 'ar': 'الأطباء', 'he': 'רופאים'},
    'profile': {'en': 'Me', 'ar': 'أنا', 'he': 'אני'},

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
    'other': {'en': 'Other', 'ar': 'أخرى', 'he': 'אחר'},
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
    'scheduled': {'en': 'Scheduled', 'ar': 'مجدول', 'he': 'מתוכנן'},
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
    'personalInformation': {'en': 'Personal Information', 'ar': 'المعلومات الشخصية', 'he': 'מידע אישי'},
    'profileUpdated': {'en': 'Profile updated successfully', 'ar': 'تم تحديث الملف الشخصي بنجاح', 'he': 'הפרופיל עודכן בהצלחה'},
    'failedToUpdateProfile': {'en': 'Failed to update profile', 'ar': 'فشل في تحديث الملف الشخصي', 'he': 'עדכון הפרופיל נכשל'},
    'takePhoto': {'en': 'Take Photo', 'ar': 'التقاط صورة', 'he': 'צלם תמונה'},
    'chooseFromGallery': {'en': 'Choose from Gallery', 'ar': 'اختر من المعرض', 'he': 'בחר מהגלריה'},
    'imageUploaded': {'en': 'Image uploaded successfully', 'ar': 'تم رفع الصورة بنجاح', 'he': 'התמונה הועלתה בהצלחה'},
    'failedToUploadImage': {'en': 'Failed to upload image', 'ar': 'فشل في رفع الصورة', 'he': 'העלאת התמונה נכשלה'},
    'failedToPickImage': {'en': 'Failed to pick image', 'ar': 'فشل في اختيار الصورة', 'he': 'בחירת התמונה נכשלה'},

    // About & Privacy
    'aboutDescription': {'en': 'Your trusted healthcare partner. Book appointments, manage your health, and stay connected with our medical team.', 'ar': 'شريكك الموثوق في الرعاية الصحية. احجز المواعيد، وأدِر صحتك، وابقَ على تواصل مع فريقنا الطبي.', 'he': 'השותף הבריאותי שלך. קבע תורים, נהל את הבריאות שלך, והישאר מחובר לצוות הרפואי שלנו.'},
    'privacyPolicy': {'en': 'Privacy Policy', 'ar': 'سياسة الخصوصية', 'he': 'מדיניות פרטיות'},
    'termsOfService': {'en': 'Terms of Service', 'ar': 'شروط الخدمة', 'he': 'תנאי שימוש'},
    'allRightsReserved': {'en': 'All rights reserved', 'ar': 'جميع الحقوق محفوظة', 'he': 'כל הזכויות שמורות'},
    'lastUpdated': {'en': 'Last updated', 'ar': 'آخر تحديث', 'he': 'עדכון אחרון'},
    'informationWeCollect': {'en': 'Information We Collect', 'ar': 'المعلومات التي نجمعها', 'he': 'מידע שאנו אוספים'},
    'informationWeCollectContent': {'en': 'We collect information you provide directly to us, such as your name, email address, phone number, and health-related information when you book appointments or use our services.', 'ar': 'نحن نجمع المعلومات التي تقدمها لنا مباشرة، مثل اسمك وعنوان بريدك الإلكتروني ورقم هاتفك والمعلومات الصحية عند حجز المواعيد أو استخدام خدماتنا.', 'he': 'אנו אוספים מידע שאתה מספק לנו ישירות, כגון שמך, כתובת האימייל, מספר הטלפון ומידע בריאותי כאשר אתה קובע תורים או משתמש בשירותים שלנו.'},
    'howWeUseInformation': {'en': 'How We Use Your Information', 'ar': 'كيف نستخدم معلوماتك', 'he': 'כיצד אנו משתמשים במידע שלך'},
    'howWeUseInformationContent': {'en': 'We use the information we collect to provide, maintain, and improve our services, process appointments, communicate with you, and ensure the security of our platform.', 'ar': 'نستخدم المعلومات التي نجمعها لتقديم خدماتنا وصيانتها وتحسينها، ومعالجة المواعيد، والتواصل معك، وضمان أمان منصتنا.', 'he': 'אנו משתמשים במידע שאנו אוספים כדי לספק, לתחזק ולשפר את השירותים שלנו, לעבד תורים, לתקשר איתך ולהבטיח את אבטחת הפלטפורמה שלנו.'},
    'dataSecurity': {'en': 'Data Security', 'ar': 'أمان البيانات', 'he': 'אבטחת מידע'},
    'dataSecurityContent': {'en': 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.', 'ar': 'نحن ننفذ تدابير أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التغيير أو الكشف أو التدمير.', 'he': 'אנו מיישמים אמצעי אבטחה מתאימים כדי להגן על המידע האישי שלך מפני גישה, שינוי, חשיפה או השמדה בלתי מורשים.'},
    'yourRights': {'en': 'Your Rights', 'ar': 'حقوقك', 'he': 'הזכויות שלך'},
    'yourRightsContent': {'en': 'You have the right to access, correct, or delete your personal information. You can also request a copy of your data or ask us to stop processing your information.', 'ar': 'لديك الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها. يمكنك أيضًا طلب نسخة من بياناتك أو مطالبتنا بالتوقف عن معالجة معلوماتك.', 'he': 'יש לך זכות לגשת, לתקן או למחוק את המידע האישי שלך. אתה יכול גם לבקש עותק של הנתונים שלך או לבקש מאיתנו להפסיק לעבד את המידע שלך.'},
    'contactUs': {'en': 'Contact Us', 'ar': 'اتصل بنا', 'he': 'צור קשר'},
    'contactUsContent': {'en': 'If you have any questions about this Privacy Policy, please contact us at the clinic or through the app.', 'ar': 'إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا في العيادة أو من خلال التطبيق.', 'he': 'אם יש לך שאלות כלשהן לגבי מדיניות הפרטיות הזו, אנא צור איתנו קשר במרפאה או דרך האפליקציה.'},

    // Location & Social
    'location': {'en': 'Location', 'ar': 'الموقع', 'he': 'מיקום'},
    'visitUs': {'en': 'Visit Us', 'ar': 'زيارتنا', 'he': 'בקרו אותנו'},
    'clinicName': {'en': 'SBA REHANA Medical Center', 'ar': 'مركز صبا ريحانة الطبي', 'he': 'מרכז רפואי סבא ריחאנה'},
    'address': {'en': 'Address', 'ar': 'العنوان', 'he': 'כתובת'},
    'clinicAddress': {'en': 'Main Street, opposite the memorial, behind Massad Sweets, Sakhnin', 'ar': 'الشارع الرئيسي مقابل النصب التذكاري خلف حلويات مساد، سخنين', 'he': 'הרחוב הראשי, מול האנדרטה, מאחורי ממתקי מסעד, סח\'נין'},
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
    'idNumberAlreadyExists': {'en': 'An account with this ID number already exists.', 'ar': 'يوجد حساب بهذا الرقم الهوية بالفعل.', 'he': 'כבר קיים חשבון עם מספר תעודת זהות זה.'},
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

    // Dialogs & Confirmations
    'signOutConfirmation': {'en': 'Are you sure you want to sign out?', 'ar': 'هل أنت متأكد أنك تريد تسجيل الخروج؟', 'he': 'האם אתה בטוח שברצונך להתנתק?'},
    'keepAppointment': {'en': 'Keep Appointment', 'ar': 'الاحتفاظ بالموعد', 'he': 'שמור תור'},
    'deleteHistory': {'en': 'Delete History', 'ar': 'حذف السجل', 'he': 'מחק היסטוריה'},
    'deleteAppointmentHistory': {'en': 'Delete Appointment History?', 'ar': 'حذف سجل المواعيد؟', 'he': 'למחוק היסטוריית תורים?'},
    'deleteHistoryWarning': {'en': 'This will permanently delete all past appointments. This action cannot be undone.', 'ar': 'سيؤدي هذا إلى حذف جميع المواعيد السابقة نهائياً. لا يمكن التراجع عن هذا الإجراء.', 'he': 'פעולה זו תמחק לצמיתות את כל התורים הקודמים. לא ניתן לבטל פעולה זו.'},
    'deletingHistory': {'en': 'Deleting history...', 'ar': 'جاري حذف السجل...', 'he': 'מוחק היסטוריה...'},
    'appointmentsDeleted': {'en': 'appointment(s) deleted', 'ar': 'موعد/مواعيد محذوفة', 'he': 'תורים נמחקו'},
    'noAppointmentsToDelete': {'en': 'No appointments to delete', 'ar': 'لا توجد مواعيد للحذف', 'he': 'אין תורים למחיקה'},
    'cancelAppointmentQuestion': {'en': 'Cancel Appointment?', 'ar': 'إلغاء الموعد؟', 'he': 'לבטל את התור?'},
    'cancelAppointmentWarning': {'en': 'This action cannot be undone. You will need to book a new appointment if you change your mind.', 'ar': 'لا يمكن التراجع عن هذا الإجراء. ستحتاج إلى حجز موعد جديد إذا غيرت رأيك.', 'he': 'לא ניתן לבטל פעולה זו. תצטרך לקבוע תור חדש אם תשנה את דעתך.'},
    'awaitingConfirmation': {'en': 'Awaiting clinic confirmation', 'ar': 'في انتظار تأكيد العيادة', 'he': 'ממתין לאישור המרפאה'},
    'failedToCancel': {'en': 'Failed to cancel', 'ar': 'فشل في الإلغاء', 'he': 'הביטול נכשל'},

    // Appointments screen
    'upcoming': {'en': 'Upcoming', 'ar': 'القادمة', 'he': 'קרובים'},
    'past': {'en': 'Past', 'ar': 'السابقة', 'he': 'קודמים'},
    'book': {'en': 'Book', 'ar': 'حجز', 'he': 'הזמן'},
    'signInToViewAppointments': {'en': 'Sign in to view your appointments', 'ar': 'سجل دخولك لعرض مواعيدك', 'he': 'התחבר כדי לצפות בתורים שלך'},
    'trackAppointments': {'en': 'Track your upcoming appointments and view your medical history', 'ar': 'تتبع مواعيدك القادمة وعرض تاريخك الطبي', 'he': 'עקוב אחר התורים הקרובים שלך וצפה בהיסטוריה הרפואית'},
    'loadingAppointments': {'en': 'Loading appointments...', 'ar': 'جاري تحميل المواعيد...', 'he': 'טוען תורים...'},
    'clearHistory': {'en': 'Clear History', 'ar': 'مسح السجل', 'he': 'נקה היסטוריה'},
    'noPastAppointments': {'en': 'No past appointments', 'ar': 'لا توجد مواعيد سابقة', 'he': 'אין תורים קודמים'},

    // Profile screen
    'editProfileComingSoon': {'en': 'Edit Profile coming soon!', 'ar': 'تعديل الملف قريباً!', 'he': 'עריכת פרופיל בקרוב!'},

    // Calendar days
    'sunday': {'en': 'Sunday', 'ar': 'الأحد', 'he': 'יום ראשון'},
    'monday': {'en': 'Monday', 'ar': 'الاثنين', 'he': 'יום שני'},
    'tuesday': {'en': 'Tuesday', 'ar': 'الثلاثاء', 'he': 'יום שלישי'},
    'wednesday': {'en': 'Wednesday', 'ar': 'الأربعاء', 'he': 'יום רביעי'},
    'thursday': {'en': 'Thursday', 'ar': 'الخميس', 'he': 'יום חמישי'},
    'friday': {'en': 'Friday', 'ar': 'الجمعة', 'he': 'יום שישי'},
    'saturday': {'en': 'Saturday', 'ar': 'السبت', 'he': 'יום שבת'},
    'schedule': {'en': 'Schedule', 'ar': 'الجدول', 'he': 'לוח זמנים'},
    'minSlots': {'en': 'min slots', 'ar': 'دقيقة للموعد', 'he': 'דקות לתור'},

    // Booking flow
    'step': {'en': 'Step', 'ar': 'الخطوة', 'he': 'שלב'},
    'of': {'en': 'of', 'ar': 'من', 'he': 'מתוך'},
    'tapToSelect': {'en': 'Tap to select', 'ar': 'انقر للاختيار', 'he': 'לחץ לבחירה'},
    'noServicesAvailable': {'en': 'No services available', 'ar': 'لا توجد خدمات متاحة', 'he': 'אין שירותים זמינים'},
    'chooseConsultationNeeded': {'en': 'Choose the type of consultation you need', 'ar': 'اختر نوع الاستشارة التي تحتاجها', 'he': 'בחר את סוג הייעוץ שאתה צריך'},
    'notesOptional': {'en': 'Notes (optional)', 'ar': 'ملاحظات (اختياري)', 'he': 'הערות (אופציונלי)'},
    'anySpecificRequirements': {'en': 'Any specific requirements...', 'ar': 'أي متطلبات خاصة...', 'he': 'דרישות מיוחדות...'},
    'willBeAddedToWaitingList': {'en': 'You will be added to the waiting list for:', 'ar': 'سيتم إضافتك لقائمة الانتظار لـ:', 'he': 'תתווסף לרשימת ההמתנה עבור:'},
    'pleaseLoginToJoinWaitingList': {'en': 'Please log in to join the waiting list', 'ar': 'يرجى تسجيل الدخول للانضمام لقائمة الانتظار', 'he': 'אנא התחבר כדי להצטרף לרשימת ההמתנה'},
    'noSlotInformation': {'en': 'No slot information available', 'ar': 'لا تتوفر معلومات عن المواعيد', 'he': 'אין מידע על תורים זמינים'},
    'editDoctor': {'en': 'Edit Doctor', 'ar': 'تعديل الطبيب', 'he': 'ערוך רופא'},

    // Short day names
    'sun': {'en': 'Sun', 'ar': 'أحد', 'he': 'א\''},
    'mon': {'en': 'Mon', 'ar': 'اثن', 'he': 'ב\''},
    'tue': {'en': 'Tue', 'ar': 'ثلا', 'he': 'ג\''},
    'wed': {'en': 'Wed', 'ar': 'أرب', 'he': 'ד\''},
    'thu': {'en': 'Thu', 'ar': 'خمي', 'he': 'ה\''},
    'fri': {'en': 'Fri', 'ar': 'جمع', 'he': 'ו\''},
    'sat': {'en': 'Sat', 'ar': 'سبت', 'he': 'ש\''},
  };
}

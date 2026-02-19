import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar' | 'he';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
    he: string;
  };
}

const translations: Translations = {
  // Navigation
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم', he: 'לוח בקרה' },
  appointments: { en: 'Appointments', ar: 'المواعيد', he: 'פגישות' },
  waitingList: { en: 'Waiting List', ar: 'قائمة الانتظار', he: 'רשימת המתנה' },
  patients: { en: 'Patients', ar: 'المرضى', he: 'מטופלים' },
  doctors: { en: 'Doctors', ar: 'الأطباء', he: 'רופאים' },
  news: { en: 'News', ar: 'الأخبار', he: 'חדשות' },
  users: { en: 'Users', ar: 'المستخدمين', he: 'משתמשים' },

  // Common
  adminPanel: { en: 'Admin Panel', ar: 'لوحة الإدارة', he: 'פאנל ניהול' },
  logout: { en: 'Logout', ar: 'تسجيل الخروج', he: 'התנתק' },
  add: { en: 'Add', ar: 'إضافة', he: 'הוסף' },
  edit: { en: 'Edit', ar: 'تعديل', he: 'ערוך' },
  delete: { en: 'Delete', ar: 'حذف', he: 'מחק' },
  cancel: { en: 'Cancel', ar: 'إلغاء', he: 'ביטול' },
  save: { en: 'Save', ar: 'حفظ', he: 'שמור' },
  create: { en: 'Create', ar: 'إنشاء', he: 'צור' },
  update: { en: 'Update', ar: 'تحديث', he: 'עדכן' },
  search: { en: 'Search', ar: 'بحث', he: 'חיפוש' },
  actions: { en: 'Actions', ar: 'إجراءات', he: 'פעולות' },

  // Dashboard
  welcomeMessage: { en: 'Welcome to Adel Clinic Admin Panel', ar: 'مرحباً بك في لوحة إدارة عيادة عادل', he: 'ברוכים הבאים לפאנל הניהול של מרפאת עדל' },
  totalPatients: { en: 'Total Patients', ar: 'إجمالي المرضى', he: 'סה״כ מטופלים' },
  totalDoctors: { en: 'Total Doctors', ar: 'إجمالي الأطباء', he: 'סה״כ רופאים' },
  todayAppointments: { en: "Today's Appointments", ar: 'مواعيد اليوم', he: 'פגישות היום' },
  upcomingAppointments: { en: 'Upcoming Appointments', ar: 'المواعيد القادمة', he: 'פגישות קרובות' },

  // Appointments
  addAppointment: { en: 'Add Appointment', ar: 'إضافة موعد', he: 'הוסף פגישה' },
  patient: { en: 'Patient', ar: 'المريض', he: 'מטופל' },
  doctor: { en: 'Doctor', ar: 'الطبيب', he: 'רופא' },
  service: { en: 'Service', ar: 'الخدمة', he: 'שירות' },
  dateTime: { en: 'Date & Time', ar: 'التاريخ والوقت', he: 'תאריך ושעה' },
  status: { en: 'Status', ar: 'الحالة', he: 'סטטוס' },
  scheduled: { en: 'Scheduled', ar: 'مجدول', he: 'מתוכנן' },
  completed: { en: 'Completed', ar: 'مكتمل', he: 'הושלם' },
  cancelled: { en: 'Cancelled', ar: 'ملغي', he: 'בוטל' },
  noShow: { en: 'No-Show', ar: 'لم يحضر', he: 'לא הגיע' },

  // Patients
  addPatient: { en: 'Add Patient', ar: 'إضافة مريض', he: 'הוסף מטופל' },
  name: { en: 'Name', ar: 'الاسم', he: 'שם' },
  fullName: { en: 'Full Name', ar: 'الاسم الكامل', he: 'שם מלא' },
  idNumber: { en: 'ID Number', ar: 'رقم الهوية', he: 'מספר ת.ז.' },
  dateOfBirth: { en: 'Date of Birth', ar: 'تاريخ الميلاد', he: 'תאריך לידה' },
  gender: { en: 'Gender', ar: 'الجنس', he: 'מגדר' },
  male: { en: 'Male', ar: 'ذكر', he: 'זכר' },
  female: { en: 'Female', ar: 'أنثى', he: 'נקבה' },
  other: { en: 'Other', ar: 'آخر', he: 'אחר' },
  phone: { en: 'Phone', ar: 'الهاتف', he: 'טלפון' },
  email: { en: 'Email', ar: 'البريد الإلكتروني', he: 'אימייל' },
  address: { en: 'Address', ar: 'العنوان', he: 'כתובת' },

  // Doctors
  addDoctor: { en: 'Add Doctor', ar: 'إضافة طبيب', he: 'הוסף רופא' },
  specialty: { en: 'Specialty', ar: 'التخصص', he: 'התמחות' },

  // Language
  language: { en: 'Language', ar: 'اللغة', he: 'שפה' },
  english: { en: 'English', ar: 'الإنجليزية', he: 'אנגלית' },
  arabic: { en: 'Arabic', ar: 'العربية', he: 'ערבית' },
  hebrew: { en: 'Hebrew', ar: 'العبرية', he: 'עברית' },

  // Additional common
  all: { en: 'All', ar: 'الكل', he: 'הכל' },
  total: { en: 'Total', ar: 'المجموع', he: 'סה״כ' },
  active: { en: 'Active', ar: 'نشط', he: 'פעיל' },
  inactive: { en: 'Inactive', ar: 'غير نشط', he: 'לא פעיל' },
  pending: { en: 'Pending', ar: 'قيد الانتظار', he: 'ממתין' },
  loading: { en: 'Loading...', ar: 'جاري التحميل...', he: 'טוען...' },
  deleting: { en: 'Deleting...', ar: 'جاري الحذف...', he: 'מוחק...' },
  uploading: { en: 'Uploading...', ar: 'جاري الرفع...', he: 'מעלה...' },

  // Patients Page
  yearsOld: { en: 'years old', ar: 'سنة', he: 'שנים' },
  managePatients: { en: 'Manage patient records and information', ar: 'إدارة سجلات المرضى والمعلومات', he: 'ניהול רשומות מטופלים ומידע' },
  searchPatientsPlaceholder: { en: 'Search patients by name, phone, email, or ID...', ar: 'البحث عن المرضى بالاسم أو الهاتف أو البريد الإلكتروني أو الهوية...', he: 'חיפוש מטופלים לפי שם, טלפון, אימייל או ת.ז...' },
  foundPatients: { en: 'Found {count} patient(s) matching "{query}"', ar: 'تم العثور على {count} مريض مطابق لـ "{query}"', he: 'נמצאו {count} מטופלים התואמים ל"{query}"' },
  noMatchingPatients: { en: 'No patients match your filters', ar: 'لا يوجد مرضى مطابقين للفلاتر', he: 'לא נמצאו מטופלים התואמים לסינון' },
  tryAdjustingFilters: { en: 'Try adjusting your search criteria', ar: 'حاول تعديل معايير البحث', he: 'נסה להתאים את קריטריוני החיפוש' },
  noPatientsYet: { en: 'No patients yet', ar: 'لا يوجد مرضى بعد', he: 'אין מטופלים עדיין' },
  addFirstPatient: { en: 'Add your first patient to get started', ar: 'أضف أول مريض للبدء', he: 'הוסף את המטופל הראשון שלך כדי להתחיל' },
  editPatient: { en: 'Edit Patient', ar: 'تعديل بيانات المريض', he: 'עריכת מטופל' },
  addNewPatient: { en: 'Add New Patient', ar: 'إضافة مريض جديد', he: 'הוספת מטופל חדש' },
  updatePatient: { en: 'Update Patient', ar: 'تحديث المريض', he: 'עדכון מטופל' },
  deletePatient: { en: 'Delete Patient', ar: 'حذف المريض', he: 'מחיקת מטופל' },
  confirmDeletePatient: { en: 'Are you sure you want to delete', ar: 'هل أنت متأكد من حذف', he: 'האם אתה בטוח שברצונך למחוק את' },
  actionCannotBeUndone: { en: 'This action cannot be undone and will remove all associated data.', ar: 'لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع البيانات المرتبطة.', he: 'פעולה זו אינה ניתנת לביטול ותסיר את כל הנתונים המשויכים.' },
  nationalId: { en: 'National ID', ar: 'الهوية الوطنية', he: 'ת.ז.' },
  phoneNumber: { en: 'Phone Number', ar: 'رقم الهاتف', he: 'מספר טלפון' },

  // Dashboard
  loadingDashboard: { en: 'Loading dashboard...', ar: 'جاري تحميل لوحة التحكم...', he: 'טוען לוח בקרה...' },
  failedToLoadAnalytics: { en: 'Failed to load analytics', ar: 'فشل في تحميل التحليلات', he: 'טעינת נתונים נכשלה' },
  registeredInSystem: { en: 'Registered in system', ar: 'مسجل في النظام', he: 'רשום במערכת' },
  activePractitioners: { en: 'Active practitioners', ar: 'أطباء نشطين', he: 'רופאים פעילים' },
  upcoming: { en: 'Upcoming', ar: 'القادمة', he: 'קרובות' },
  scheduledAppointments: { en: 'Scheduled appointments', ar: 'مواعيد مجدولة', he: 'פגישות מתוכננות' },
  getStarted: { en: 'Get Started with Adel Clinic', ar: 'ابدأ مع عيادة عادل', he: 'התחל עם מרפאת עדל' },
  startByAdding: { en: 'Start by adding doctors, patients, and scheduling appointments.', ar: 'ابدأ بإضافة أطباء ومرضى وجدولة المواعيد.', he: 'התחל על ידי הוספת רופאים, מטופלים וקביעת פגישות.' },
  addDoctorsAction: { en: 'Add doctors', ar: 'إضافة أطباء', he: 'הוסף רופאים' },
  registerPatientsAction: { en: 'Register patients', ar: 'تسجيل مرضى', he: 'רשום מטופלים' },
  scheduleAppointmentsAction: { en: 'Schedule appointments', ar: 'جدولة المواعيد', he: 'קבע פגישות' },
  postHealthNews: { en: 'Post health news', ar: 'نشر أخبار صحية', he: 'פרסם חדשות בריאות' },
  appointmentTrends: { en: 'Appointment Trends', ar: 'اتجاهات المواعيد', he: 'מגמות פגישות' },
  last30Days: { en: 'Last 30 days', ar: 'آخر 30 يوم', he: '30 הימים האחרונים' },
  appointmentStatus: { en: 'Appointment Status', ar: 'حالة المواعيد', he: 'סטטוס פגישות' },
  allTimeBreakdown: { en: 'All time breakdown', ar: 'تفصيل كل الأوقات', he: 'פירוט כל הזמנים' },

  // Doctors Page
  manageDoctors: { en: 'Manage medical staff and schedules', ar: 'إدارة الطاقم الطبي والجداول', he: 'ניהול צוות רפואי ולוחות זמנים' },
  searchDoctorsPlaceholder: { en: 'Search doctors by name or specialty...', ar: 'البحث عن أطباء بالاسم أو التخصص...', he: 'חיפוש רופאים לפי שם או התמחות...' },
  foundDoctors: { en: 'Found {count} doctor(s) matching "{query}"', ar: 'تم العثور على {count} طبيب مطابق لـ "{query}"', he: 'נמצאו {count} רופאים התואמים ל"{query}"' },
  noMatchingDoctors: { en: 'No doctors match your filters', ar: 'لا يوجد أطباء مطابقين للفلاتر', he: 'לא נמצאו רופאים התואמים לסינון' },
  noDoctorsYet: { en: 'No doctors yet', ar: 'لا يوجد أطباء بعد', he: 'אין רופאים עדיין' },
  addFirstDoctor: { en: 'Add your first doctor to get started', ar: 'أضف أول طبيب للبدء', he: 'הוסף את הרופא הראשון שלך כדי להתחיל' },
  editDoctor: { en: 'Edit Doctor', ar: 'تعديل بيانات الطبيب', he: 'עריכת רופא' },
  addNewDoctor: { en: 'Add New Doctor', ar: 'إضافة طبيب جديد', he: 'הוספת רופא חדש' },
  updateDoctor: { en: 'Update Doctor', ar: 'تحديث الطبيب', he: 'עדכון רופא' },
  noSchedule: { en: 'No schedule', ar: 'لا يوجد جدول', he: 'אין לוח זמנים' },
  doctorPhoto: { en: 'Doctor Photo', ar: 'صورة الطبيب', he: 'תמונת הרופא' },
  uploadPhoto: { en: 'Upload Photo', ar: 'رفع صورة', he: 'העלה תמונה' },
  changePhoto: { en: 'Change Photo', ar: 'تغيير الصورة', he: 'שנה תמונה' },
  arabicSection: { en: 'Arabic (العربية)', ar: 'العربية', he: 'ערבית (العربية)' },
  englishSection: { en: 'English', ar: 'الإنجليزية', he: 'אנגלית' },
  hebrewSection: { en: 'Hebrew (עברית)', ar: 'العبرية (עברית)', he: 'עברית' },
  fullNameArabic: { en: 'Full Name (Arabic)', ar: 'الاسم الكامل (عربي)', he: 'שם מלא (ערבית)' },
  fullNameEnglish: { en: 'Full Name (English)', ar: 'الاسم الكامل (إنجليزي)', he: 'שם מלא (אנגלית)' },
  fullNameHebrew: { en: 'Full Name (Hebrew)', ar: 'الاسم الكامل (عبري)', he: 'שם מלא (עברית)' },
  specialtiesArabic: { en: 'Specialties (Arabic)', ar: 'التخصصات (عربي)', he: 'התמחויות (ערבית)' },
  specialtiesEnglish: { en: 'Specialties (English)', ar: 'التخصصات (إنجليزي)', he: 'התמחויות (אנגלית)' },
  specialtiesHebrew: { en: 'Specialties (Hebrew)', ar: 'التخصصات (عبري)', he: 'התמחויות (עברית)' },
  qualifications: { en: 'Qualifications', ar: 'المؤهلات', he: 'כישורים' },
  qualificationsArabic: { en: 'Qualifications (Arabic)', ar: 'المؤهلات (عربي)', he: 'כישורים (ערבית)' },
  qualificationsEnglish: { en: 'Qualifications (English)', ar: 'المؤهلات (إنجليزي)', he: 'כישורים (אנגלית)' },
  qualificationsHebrew: { en: 'Qualifications (Hebrew)', ar: 'المؤهلات (عبري)', he: 'כישורים (עברית)' },
  bio: { en: 'Bio', ar: 'نبذة', he: 'ביוגרפיה' },
  bioArabic: { en: 'Bio (Arabic)', ar: 'نبذة (عربي)', he: 'ביוגרפיה (ערבית)' },
  bioEnglish: { en: 'Bio (English)', ar: 'نبذة (إنجليزي)', he: 'ביוגרפיה (אנגלית)' },
  bioHebrew: { en: 'Bio (Hebrew)', ar: 'نبذة (عبري)', he: 'ביוגרפיה (עברית)' },
  userId: { en: 'User ID', ar: 'معرف المستخدم', he: 'מזהה משתמש' },
  linkToUserAccount: { en: 'Link to existing user account', ar: 'ربط بحساب مستخدم موجود', he: 'קשר לחשבון משתמש קיים' },
  schedule: { en: 'Schedule', ar: 'الجدول', he: 'לוח זמנים' },
  scheduleBlock: { en: 'Schedule Block', ar: 'كتلة الجدول', he: 'בלוק לוח זמנים' },
  roleType: { en: 'Role/Type', ar: 'الدور/النوع', he: 'תפקיד/סוג' },
  selectDays: { en: 'Select Days:', ar: 'اختر الأيام:', he: 'בחר ימים:' },
  startTime: { en: 'Start Time', ar: 'وقت البدء', he: 'שעת התחלה' },
  endTime: { en: 'End Time', ar: 'وقت الانتهاء', he: 'שעת סיום' },
  slotDuration: { en: 'Slot (mins)', ar: 'مدة الفترة (دقائق)', he: 'משך (דקות)' },
  addAnotherTimeBlock: { en: 'Add Another Time Block', ar: 'إضافة فترة زمنية أخرى', he: 'הוסף בלוק זמן נוסף' },
  separateWithCommas: { en: 'Separate with commas', ar: 'افصل بفواصل', he: 'הפרד בפסיקים' },
  pressEnterToAdd: { en: 'Type and press Enter to add each item', ar: 'اكتب واضغط Enter لإضافة كل عنصر', he: 'הקלד ולחץ Enter להוספת כל פריט' },

  // Days of week
  sunday: { en: 'Sunday', ar: 'الأحد', he: 'ראשון' },
  monday: { en: 'Monday', ar: 'الاثنين', he: 'שני' },
  tuesday: { en: 'Tuesday', ar: 'الثلاثاء', he: 'שלישי' },
  wednesday: { en: 'Wednesday', ar: 'الأربعاء', he: 'רביעי' },
  thursday: { en: 'Thursday', ar: 'الخميس', he: 'חמישי' },
  friday: { en: 'Friday', ar: 'الجمعة', he: 'שישי' },
  saturday: { en: 'Saturday', ar: 'السبت', he: 'שבת' },
  sun: { en: 'Sun', ar: 'أحد', he: 'א' },
  mon: { en: 'Mon', ar: 'اثن', he: 'ב' },
  tue: { en: 'Tue', ar: 'ثلا', he: 'ג' },
  wed: { en: 'Wed', ar: 'أرب', he: 'ד' },
  thu: { en: 'Thu', ar: 'خمي', he: 'ה' },
  fri: { en: 'Fri', ar: 'جمع', he: 'ו' },
  sat: { en: 'Sat', ar: 'سبت', he: 'ש' },

  // News Page
  addNews: { en: 'Add News', ar: 'إضافة خبر', he: 'הוסף חדשות' },
  manageNews: { en: 'Manage health news and updates', ar: 'إدارة الأخبار الصحية والتحديثات', he: 'ניהול חדשות ועדכונים רפואיים' },
  published: { en: 'Published', ar: 'منشور', he: 'פורסם' },
  draft: { en: 'Draft', ar: 'مسودة', he: 'טיוטה' },
  noNewsYet: { en: 'No news yet', ar: 'لا توجد أخبار بعد', he: 'אין חדשות עדיין' },
  addFirstNews: { en: 'Add your first news article', ar: 'أضف أول مقال إخباري', he: 'הוסף את מאמר החדשות הראשון' },
  editNews: { en: 'Edit News', ar: 'تعديل الخبر', he: 'עריכת חדשות' },
  addNewNews: { en: 'Add New Article', ar: 'إضافة مقال جديد', he: 'הוספת מאמר חדש' },
  updateNews: { en: 'Update News', ar: 'تحديث الخبر', he: 'עדכון חדשות' },
  title: { en: 'Title', ar: 'العنوان', he: 'כותרת' },
  content: { en: 'Content', ar: 'المحتوى', he: 'תוכן' },

  // Users Page
  manageUsers: { en: 'Manage system users and permissions', ar: 'إدارة مستخدمي النظام والصلاحيات', he: 'ניהול משתמשי מערכת והרשאות' },
  addUser: { en: 'Add User', ar: 'إضافة مستخدم', he: 'הוסף משתמש' },
  noUsersYet: { en: 'No users yet', ar: 'لا يوجد مستخدمين بعد', he: 'אין משתמשים עדיין' },
  role: { en: 'Role', ar: 'الدور', he: 'תפקיד' },
  admin: { en: 'Admin', ar: 'مسؤول', he: 'מנהל' },
  editUser: { en: 'Edit User', ar: 'تعديل المستخدم', he: 'עריכת משתמש' },
  addNewUser: { en: 'Add New User', ar: 'إضافة مستخدم جديد', he: 'הוספת משתמש חדש' },
  updateUser: { en: 'Update User', ar: 'تحديث المستخدم', he: 'עדכון משתמש' },
  password: { en: 'Password', ar: 'كلمة المرور', he: 'סיסמה' },
  displayName: { en: 'Display Name', ar: 'اسم العرض', he: 'שם תצוגה' },

  // Waiting List Page
  manageWaitingList: { en: 'Manage patient waiting list', ar: 'إدارة قائمة انتظار المرضى', he: 'ניהול רשימת המתנה למטופלים' },
  addToWaitingList: { en: 'Add to Waiting List', ar: 'إضافة إلى قائمة الانتظار', he: 'הוסף לרשימת המתנה' },
  noWaitingListYet: { en: 'No patients in waiting list', ar: 'لا يوجد مرضى في قائمة الانتظار', he: 'אין מטופלים ברשימת ההמתנה' },
  position: { en: 'Position', ar: 'الموقع', he: 'מיקום' },
  notes: { en: 'Notes', ar: 'ملاحظات', he: 'הערות' },
  priority: { en: 'Priority', ar: 'الأولوية', he: 'עדיפות' },
  normal: { en: 'Normal', ar: 'عادي', he: 'רגיל' },
  urgent: { en: 'Urgent', ar: 'عاجل', he: 'דחוף' },
  emergency: { en: 'Emergency', ar: 'طارئ', he: 'חירום' },

  // Appointments Page
  manageAppointments: { en: 'Manage and schedule appointments', ar: 'إدارة وجدولة المواعيد', he: 'ניהול וקביעת פגישות' },
  noAppointmentsYet: { en: 'No appointments yet', ar: 'لا توجد مواعيد بعد', he: 'אין פגישות עדיין' },
  addFirstAppointment: { en: 'Schedule your first appointment', ar: 'جدول أول موعد', he: 'קבע את הפגישה הראשונה' },
  editAppointment: { en: 'Edit Appointment', ar: 'تعديل الموعد', he: 'עריכת פגישה' },
  addNewAppointment: { en: 'Add New Appointment', ar: 'إضافة موعد جديد', he: 'הוספת פגישה חדשה' },
  updateAppointment: { en: 'Update Appointment', ar: 'تحديث الموعد', he: 'עדכון פגישה' },
  selectPatient: { en: 'Select Patient', ar: 'اختر المريض', he: 'בחר מטופל' },
  selectDoctor: { en: 'Select Doctor', ar: 'اختر الطبيب', he: 'בחר רופא' },
  time: { en: 'Time', ar: 'الوقت', he: 'שעה' },
  date: { en: 'Date', ar: 'التاريخ', he: 'תאריך' },
  reason: { en: 'Reason', ar: 'السبب', he: 'סיבה' },
  today: { en: 'Today', ar: 'اليوم', he: 'היום' },
  tomorrow: { en: 'Tomorrow', ar: 'غداً', he: 'מחר' },
  thisWeek: { en: 'This Week', ar: 'هذا الأسبوع', he: 'השבוע' },

  // Appointments Page - Additional
  listView: { en: 'List View', ar: 'عرض القائمة', he: 'תצוגת רשימה' },
  calendarView: { en: 'Calendar View', ar: 'عرض التقويم', he: 'תצוגת יומן' },
  archive: { en: 'Archive', ar: 'الأرشيف', he: 'ארכיון' },
  noArchivedAppointments: { en: 'No archived appointments', ar: 'لا توجد مواعيد مؤرشفة', he: 'אין פגישות בארכיון' },
  noAppointments: { en: 'No appointments', ar: 'لا توجد مواعيد', he: 'אין פגישות' },
  showLess: { en: 'Show less', ar: 'عرض أقل', he: 'הצג פחות' },
  showMore: { en: 'Show {count} more', ar: 'عرض {count} المزيد', he: 'הצג עוד {count}' },
  upcomingAppointmentsCount: { en: '{count} upcoming appointments', ar: '{count} مواعيد قادمة', he: '{count} פגישות קרובות' },
  appointmentsCount: { en: '{count} appointment(s)', ar: '{count} موعد', he: '{count} פגישות' },
  noDoctorsAvailable: { en: 'No doctors available', ar: 'لا يوجد أطباء متاحين', he: 'אין רופאים זמינים' },
  patientInformation: { en: 'Patient Information', ar: 'معلومات المريض', he: 'פרטי מטופל' },
  newPatient: { en: 'New Patient', ar: 'مريض جديد', he: 'מטופל חדש' },
  appointmentDetails: { en: 'Appointment Details', ar: 'تفاصيل الموعد', he: 'פרטי הפגישה' },
  timeSlot: { en: 'Time Slot', ar: 'الفترة الزمنية', he: 'משבצת זמן' },
  loadingAvailableSlots: { en: 'Loading available slots...', ar: 'جاري تحميل الفترات المتاحة...', he: 'טוען משבצות זמינות...' },
  noAvailableSlotsWarning: { en: 'No available slots for this date. You can add the patient to the waiting list.', ar: 'لا توجد فترات متاحة لهذا التاريخ. يمكنك إضافة المريض إلى قائمة الانتظار.', he: 'אין משבצות זמינות לתאריך זה. ניתן להוסיף את המטופל לרשימת ההמתנה.' },
  doctorNotAvailable: { en: 'Doctor is not available on this date.', ar: 'الطبيب غير متاح في هذا التاريخ.', he: 'הרופא אינו זמין בתאריך זה.' },
  slotsAvailable: { en: '{count} slots available', ar: '{count} فترات متاحة', he: '{count} משבצות זמינות' },
  selectDoctorAndDate: { en: 'Select a doctor and date to see available time slots', ar: 'اختر طبيباً وتاريخاً لرؤية الفترات المتاحة', he: 'בחר רופא ותאריך לצפייה במשבצות זמינות' },
  notesOptional: { en: 'Notes (optional)', ar: 'ملاحظات (اختياري)', he: 'הערות (אופציונלי)' },
  createAppointment: { en: 'Create Appointment', ar: 'إنشاء موعد', he: 'צור פגישה' },
  deleteAppointment: { en: 'Delete Appointment', ar: 'حذف الموعد', he: 'מחק פגישה' },
  confirmDeleteAppointment: { en: 'Are you sure you want to delete the appointment for', ar: 'هل أنت متأكد من حذف الموعد لـ', he: 'האם אתה בטוח שברצונך למחוק את הפגישה של' },
  on: { en: 'on', ar: 'في', he: 'ב' },
  at: { en: 'at', ar: 'في', he: 'בשעה' },
  general: { en: 'General', ar: 'عام', he: 'כללי' },
  more: { en: 'more', ar: 'المزيد', he: 'עוד' },
  creating: { en: 'Creating...', ar: 'جاري الإنشاء...', he: 'יוצר...' },
  newAppointment: { en: 'New Appointment', ar: 'موعد جديد', he: 'פגישה חדשה' },
  scheduleAppointment: { en: 'Schedule Appointment', ar: 'جدولة الموعد', he: 'קבע פגישה' },
  scheduling: { en: 'Scheduling...', ar: 'جاري الجدولة...', he: 'מתזמן...' },
  dr: { en: 'Dr.', ar: 'د.', he: 'ד"ר' },

  // Waiting List Page - Additional
  waiting: { en: 'Waiting', ar: 'قيد الانتظار', he: 'ממתין' },
  booked: { en: 'Booked', ar: 'محجوز', he: 'הוזמן' },
  manageWaitingQueue: { en: 'Manage patient waiting queue and appointments', ar: 'إدارة قائمة انتظار المرضى والمواعيد', he: 'ניהול תור המתנה למטופלים ופגישות' },
  searchByPatientDoctorService: { en: 'Search by patient, doctor, or service...', ar: 'البحث بالمريض أو الطبيب أو الخدمة...', he: 'חיפוש לפי מטופל, רופא או שירות...' },
  allDoctors: { en: 'All Doctors', ar: 'جميع الأطباء', he: 'כל הרופאים' },
  noEntriesMatchFilters: { en: 'No entries match your filters', ar: 'لا توجد نتائج مطابقة للفلاتر', he: 'אין רשומות התואמות לסינון' },
  noEntriesInWaitingList: { en: 'No entries in waiting list', ar: 'لا توجد إدخالات في قائمة الانتظار', he: 'אין רשומות ברשימת ההמתנה' },
  tryAdjustingFiltersWaitingList: { en: 'Try adjusting your filters', ar: 'حاول تعديل الفلاتر', he: 'נסה להתאים את הסינון' },
  addPatientsToGetStarted: { en: 'Add patients to the waiting list to get started', ar: 'أضف المرضى إلى قائمة الانتظار للبدء', he: 'הוסף מטופלים לרשימת ההמתנה כדי להתחיל' },
  convertToAppointment: { en: 'Convert to Appointment', ar: 'تحويل إلى موعد', he: 'המרה לפגישה' },
  book: { en: 'Book', ar: 'حجز', he: 'הזמן' },
  remove: { en: 'Remove', ar: 'إزالة', he: 'הסר' },
  waitingListDetails: { en: 'Waiting List Details', ar: 'تفاصيل قائمة الانتظار', he: 'פרטי רשימת המתנה' },
  preferredDate: { en: 'Preferred Date', ar: 'التاريخ المفضل', he: 'תאריך מועדף' },
  allSlotsBookedWarning: { en: 'All slots are booked for this date. Please select another date.', ar: 'جميع الفترات محجوزة لهذا التاريخ. يرجى اختيار تاريخ آخر.', he: 'כל המשבצות תפוסות לתאריך זה. אנא בחר תאריך אחר.' },
  doctorNotAvailableForService: { en: 'Doctor is not available for this service on the selected date.', ar: 'الطبيب غير متاح لهذه الخدمة في التاريخ المحدد.', he: 'הרופא אינו זמין לשירות זה בתאריך שנבחר.' },
  selectDoctorServiceAndDate: { en: 'Select doctor, service, and date to see available time slots', ar: 'اختر الطبيب والخدمة والتاريخ لرؤية الفترات المتاحة', he: 'בחר רופא, שירות ותאריך לצפייה במשבצות זמינות' },
  selectTimeSlot: { en: 'Select Time Slot', ar: 'اختر الفترة الزمنية', he: 'בחר משבצת זמן' },
  converting: { en: 'Converting...', ar: 'جاري التحويل...', he: 'ממיר...' },

  // News Page - Additional
  newsAndUpdates: { en: 'News & Updates', ar: 'الأخبار والتحديثات', he: 'חדשות ועדכונים' },
  manageClinicAnnouncements: { en: 'Manage clinic announcements and health tips', ar: 'إدارة إعلانات العيادة والنصائح الصحية', he: 'ניהול הודעות המרפאה וטיפים בריאותיים' },
  drafts: { en: 'Drafts', ar: 'المسودات', he: 'טיוטות' },
  searchNewsByTitleContentAuthor: { en: 'Search news by title, content, or author...', ar: 'البحث بالعنوان أو المحتوى أو المؤلف...', he: 'חיפוש חדשות לפי כותרת, תוכן או מחבר...' },
  category: { en: 'Category', ar: 'الفئة', he: 'קטגוריה' },
  allCategories: { en: 'All Categories', ar: 'جميع الفئات', he: 'כל הקטגוריות' },
  announcement: { en: 'Announcement', ar: 'إعلان', he: 'הודעה' },
  healthTip: { en: 'Health Tip', ar: 'نصيحة صحية', he: 'טיפ בריאותי' },
  eventCategory: { en: 'Event', ar: 'حدث', he: 'אירוע' },
  noNewsMatchFilters: { en: 'No news match your filters', ar: 'لا توجد أخبار مطابقة للفلاتر', he: 'אין חדשות התואמות לסינון' },
  createFirstNewsArticle: { en: 'Create your first news article', ar: 'أنشئ أول مقال إخباري', he: 'צור את מאמר החדשות הראשון שלך' },
  newsImage: { en: 'News Image', ar: 'صورة الخبر', he: 'תמונת חדשות' },
  uploadImage: { en: 'Upload Image', ar: 'رفع صورة', he: 'העלה תמונה' },
  supportedFormats: { en: 'Supported formats: JPG, PNG, GIF. Max size: 5MB', ar: 'التنسيقات المدعومة: JPG, PNG, GIF. الحد الأقصى: 5 ميجابايت', he: 'פורמטים נתמכים: JPG, PNG, GIF. גודל מקסימלי: 5MB' },
  saveAsDraft: { en: 'Save as draft', ar: 'حفظ كمسودة', he: 'שמור כטיוטה' },
  uploadingImage: { en: 'Uploading...', ar: 'جاري الرفع...', he: 'מעלה...' },
  createNewsBtn: { en: 'Create News', ar: 'إنشاء خبر', he: 'צור חדשות' },
  by: { en: 'By', ar: 'بواسطة', he: 'מאת' },
  pleaseSelectImageFile: { en: 'Please select an image file', ar: 'يرجى اختيار ملف صورة', he: 'אנא בחר קובץ תמונה' },
  imageSizeTooLarge: { en: 'Image size must be less than 5MB', ar: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت', he: 'גודל התמונה חייב להיות פחות מ-5MB' },
  failedToUploadImage: { en: 'Failed to upload image. Please try again.', ar: 'فشل رفع الصورة. يرجى المحاولة مرة أخرى.', he: 'העלאת התמונה נכשלה. אנא נסה שוב.' },

  // Users Page - Additional
  deactivate: { en: 'Deactivate', ar: 'إلغاء التفعيل', he: 'בטל הפעלה' },
  activate: { en: 'Activate', ar: 'تفعيل', he: 'הפעל' },
  deactivateUser: { en: 'Deactivate User', ar: 'إلغاء تفعيل المستخدم', he: 'בטל הפעלת משתמש' },
  activateUser: { en: 'Activate User', ar: 'تفعيل المستخدم', he: 'הפעל משתמש' },
  deleteUser: { en: 'Delete User', ar: 'حذف المستخدم', he: 'מחק משתמש' },
  confirmDeleteUser: { en: 'Are you sure you want to delete', ar: 'هل أنت متأكد من حذف', he: 'האם אתה בטוח שברצונך למחוק את' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  const direction = language === 'ar' || language === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, direction }}>
      {children}
    </LanguageContext.Provider>
  );
};

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

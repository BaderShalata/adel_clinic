import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Primary color palette - Deep Teal with richness
  static const Color primaryColor = Color(0xFF0F766E);
  static const Color primaryLight = Color(0xFF0D9488);
  static const Color primaryDark = Color(0xFF115E59);
  static const Color primarySurface = Color(0xFFCCFBF1);

  // Secondary accent colors
  static const Color accentColor = Color(0xFF6366F1);
  static const Color accentLight = Color(0xFF818CF8);
  static const Color successColor = Color(0xFF22C55E);
  static const Color successLight = Color(0xFFDCFCE7);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color errorColor = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFEE2E2);

  // Neutral colors - warm beige palette
  static const Color surfaceLight = Color(0xFFF7F3EE);  // Warmer beige background
  static const Color surfaceMedium = Color(0xFFF0EBE3); // Slightly darker beige
  static const Color cardBackground = Color(0xFFFFFDF9); // Warm off-white for cards
  static const Color dividerColor = Color(0xFFE5DFD5);  // Warm beige divider
  static const Color tableHeaderBg = Color(0xFFF0EBE3);

  // Text colors
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textHint = Color(0xFF94A3B8);
  static const Color textOnPrimary = Colors.white;

  // Gradient definitions
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryLight, primaryDark],
  );

  static const LinearGradient headerGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [primaryColor, primaryDark],
  );

  // Rich diagonal gradient for hero sections
  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF0D9488),
      Color(0xFF0F766E),
      Color(0xFF115E59),
    ],
    stops: [0.0, 0.5, 1.0],
  );

  // Subtle surface gradient for cards
  static const LinearGradient surfaceGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [cardBackground, surfaceLight],
  );

  // Accent gradient for special elements
  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accentLight, accentColor],
  );

  // Success gradient for positive actions
  static const LinearGradient successGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF34D399), successColor],
  );

  // Warm beige background gradient
  static const LinearGradient warmBackgroundGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [surfaceLight, surfaceMedium],
  );

  // Shadow definitions
  static List<BoxShadow> get softShadow => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.02),
          blurRadius: 4,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get mediumShadow => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.08),
          blurRadius: 20,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 8,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get coloredShadow => [
        BoxShadow(
          color: primaryColor.withValues(alpha: 0.3),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ];

  // Spacing constants
  static const double spacingXS = 4.0;
  static const double spacingS = 8.0;
  static const double spacingM = 16.0;
  static const double spacingL = 24.0;
  static const double spacingXL = 32.0;
  static const double spacingXXL = 48.0;

  // Border radius
  static const double radiusXS = 4.0;
  static const double radiusS = 8.0;
  static const double radiusM = 12.0;
  static const double radiusL = 16.0;
  static const double radiusXL = 24.0;
  static const double radiusRound = 100.0;

  // Card elevation
  static const double elevationS = 2.0;
  static const double elevationM = 4.0;
  static const double elevationL = 8.0;

  // Animation durations
  static const Duration animFast = Duration(milliseconds: 150);
  static const Duration animMedium = Duration(milliseconds: 300);
  static const Duration animSlow = Duration(milliseconds: 500);

  // Font fallbacks for RTL languages
  static const List<String> _fontFallback = ['Cairo', 'Noto Sans Arabic', 'Noto Sans Hebrew'];

  static ThemeData get lightTheme {
    // Rubik - modern, geometric, supports Hebrew + Latin (designed in Israel)
    // Cairo fallback for Arabic script
    final headingFont = GoogleFonts.rubik();
    final bodyFont = GoogleFonts.rubik();

    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
        primary: primaryColor,
        secondary: accentColor,
        surface: surfaceLight,
        error: errorColor,
      ),
      scaffoldBackgroundColor: surfaceLight,
      textTheme: TextTheme(
        headlineLarge: headingFont.copyWith(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          color: textPrimary,
          letterSpacing: -1.0,
          height: 1.1,
          fontFamilyFallback: _fontFallback,
        ),
        headlineMedium: headingFont.copyWith(
          fontSize: 26,
          fontWeight: FontWeight.w700,
          color: textPrimary,
          letterSpacing: -0.6,
          height: 1.15,
          fontFamilyFallback: _fontFallback,
        ),
        headlineSmall: headingFont.copyWith(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: textPrimary,
          letterSpacing: -0.4,
          height: 1.2,
          fontFamilyFallback: _fontFallback,
        ),
        titleLarge: headingFont.copyWith(
          fontSize: 19,
          fontWeight: FontWeight.w700,
          color: textPrimary,
          letterSpacing: -0.3,
          height: 1.25,
          fontFamilyFallback: _fontFallback,
        ),
        titleMedium: headingFont.copyWith(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: textPrimary,
          letterSpacing: -0.1,
          height: 1.3,
          fontFamilyFallback: _fontFallback,
        ),
        titleSmall: headingFont.copyWith(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: textPrimary,
          letterSpacing: 0,
          fontFamilyFallback: _fontFallback,
        ),
        bodyLarge: bodyFont.copyWith(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: textPrimary,
          height: 1.55,
          letterSpacing: 0.1,
          fontFamilyFallback: _fontFallback,
        ),
        bodyMedium: bodyFont.copyWith(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: textSecondary,
          height: 1.5,
          letterSpacing: 0.05,
          fontFamilyFallback: _fontFallback,
        ),
        bodySmall: bodyFont.copyWith(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: textHint,
          height: 1.4,
          letterSpacing: 0.1,
          fontFamilyFallback: _fontFallback,
        ),
        labelLarge: bodyFont.copyWith(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: textPrimary,
          letterSpacing: 0.1,
          fontFamilyFallback: _fontFallback,
        ),
        labelMedium: bodyFont.copyWith(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textSecondary,
          letterSpacing: 0.2,
          fontFamilyFallback: _fontFallback,
        ),
        labelSmall: bodyFont.copyWith(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: textHint,
          letterSpacing: 0.2,
          fontFamilyFallback: _fontFallback,
        ),
      ),

      // AppBar theme
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: cardBackground,
        foregroundColor: textPrimary,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black.withOpacity(0.05),
        titleTextStyle: headingFont.copyWith(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
          letterSpacing: -0.1,
          fontFamilyFallback: _fontFallback,
        ),
      ),

      // Card theme with subtle shadow
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusL),
        ),
        color: cardBackground,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black.withOpacity(0.08),
        margin: EdgeInsets.zero,
      ),

      // Elevated button theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(
            horizontal: spacingL,
            vertical: spacingM,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusM),
          ),
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          textStyle: bodyFont.copyWith(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
            fontFamilyFallback: _fontFallback,
          ),
        ),
      ),

      // Outlined button theme
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: spacingL,
            vertical: spacingM,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusM),
          ),
          side: const BorderSide(color: primaryColor, width: 1.5),
          foregroundColor: primaryColor,
          textStyle: bodyFont.copyWith(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
            fontFamilyFallback: _fontFallback,
          ),
        ),
      ),

      // Text button theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
          textStyle: bodyFont.copyWith(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            fontFamilyFallback: _fontFallback,
          ),
        ),
      ),

      // Input decoration theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardBackground,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusM),
          borderSide: const BorderSide(color: dividerColor, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusM),
          borderSide: const BorderSide(color: dividerColor, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusM),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusM),
          borderSide: const BorderSide(color: errorColor, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusM),
          borderSide: const BorderSide(color: errorColor, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: spacingM,
          vertical: spacingM,
        ),
        hintStyle: bodyFont.copyWith(
          color: textHint,
          fontSize: 14,
          fontFamilyFallback: _fontFallback,
        ),
        labelStyle: bodyFont.copyWith(
          color: textSecondary,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          fontFamilyFallback: _fontFallback,
        ),
        floatingLabelStyle: bodyFont.copyWith(
          color: primaryColor,
          fontSize: 14,
          fontWeight: FontWeight.w600,
          fontFamilyFallback: _fontFallback,
        ),
      ),

      // Bottom navigation bar theme
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: cardBackground,
        elevation: 0,
        height: 70,
        indicatorColor: primarySurface,
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return bodyFont.copyWith(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: primaryColor,
              fontFamilyFallback: _fontFallback,
            );
          }
          return bodyFont.copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: textSecondary,
            fontFamilyFallback: _fontFallback,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: primaryColor, size: 26);
          }
          return const IconThemeData(color: textSecondary, size: 24);
        }),
      ),

      // Tab bar theme
      tabBarTheme: TabBarThemeData(
        labelColor: primaryColor,
        unselectedLabelColor: textSecondary,
        indicatorColor: primaryColor,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: bodyFont.copyWith(
          fontWeight: FontWeight.w600,
          fontSize: 14,
          fontFamilyFallback: _fontFallback,
        ),
        unselectedLabelStyle: bodyFont.copyWith(
          fontWeight: FontWeight.w500,
          fontSize: 14,
          fontFamilyFallback: _fontFallback,
        ),
      ),

      // Chip theme
      chipTheme: ChipThemeData(
        backgroundColor: primarySurface,
        labelStyle: bodyFont.copyWith(
          color: primaryDark,
          fontSize: 12,
          fontWeight: FontWeight.w600,
          fontFamilyFallback: _fontFallback,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: spacingM,
          vertical: spacingS,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusRound),
        ),
        side: BorderSide.none,
      ),

      // Floating action button theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 4,
        focusElevation: 6,
        hoverElevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusL),
        ),
      ),

      // Divider theme
      dividerTheme: const DividerThemeData(
        color: dividerColor,
        thickness: 1,
        space: 1,
      ),

      // Dialog theme - modern with larger radius
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusL),
        ),
        backgroundColor: cardBackground,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shadowColor: Colors.black.withOpacity(0.15),
        titleTextStyle: bodyFont.copyWith(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        contentTextStyle: bodyFont.copyWith(
          fontSize: 14,
          color: textSecondary,
        ),
      ),

      // Snackbar theme
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusM),
        ),
        elevation: 4,
        backgroundColor: textPrimary,
        contentTextStyle: bodyFont.copyWith(
          color: Colors.white,
          fontSize: 14,
        ),
      ),

      // Bottom sheet theme - modern with smaller radius
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: cardBackground,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(radiusL),
          ),
        ),
      ),

      // List tile theme
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: spacingM,
          vertical: spacingS,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusM),
        ),
        titleTextStyle: bodyFont.copyWith(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        subtitleTextStyle: bodyFont.copyWith(
          fontSize: 14,
          color: textSecondary,
        ),
      ),

      // Icon theme
      iconTheme: const IconThemeData(
        color: textSecondary,
        size: 24,
      ),
      primaryIconTheme: const IconThemeData(
        color: primaryColor,
        size: 24,
      ),
    );
  }
}

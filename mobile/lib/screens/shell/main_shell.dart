import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../theme/app_theme.dart';
import '../home/new_home_screen.dart';
import '../doctors/doctors_screen.dart';
import '../appointments/appointments_screen.dart';
import '../profile/profile_screen.dart';
import '../admin/admin_shell.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with TickerProviderStateMixin {
  int _currentIndex = 0;
  late List<AnimationController> _animationControllers;
  late List<Animation<double>> _scaleAnimations;

  final List<Widget> _screens = const [
    NewHomeScreen(),
    DoctorsScreen(),
    AppointmentsScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _animationControllers = List.generate(
      4,
      (index) => AnimationController(
        duration: const Duration(milliseconds: 300),
        vsync: this,
      ),
    );
    _scaleAnimations = _animationControllers.map((controller) {
      return Tween<double>(begin: 1.0, end: 1.15).animate(
        CurvedAnimation(parent: controller, curve: Curves.easeOutBack),
      );
    }).toList();

    // Start with first item animated
    _animationControllers[0].forward();
  }

  @override
  void dispose() {
    for (var controller in _animationControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (_currentIndex != index) {
      _animationControllers[_currentIndex].reverse();
      _animationControllers[index].forward();
      setState(() {
        _currentIndex = index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final languageProvider = context.watch<LanguageProvider>();

    // If user is admin, show admin interface
    if (authProvider.isLoggedIn && authProvider.isAdmin) {
      return const AdminShell();
    }

    final navItems = [
      _NavItem(Icons.home_outlined, Icons.home_rounded, languageProvider.t('home')),
      _NavItem(Icons.medical_services_outlined, Icons.medical_services_rounded, languageProvider.t('doctors')),
      _NavItem(Icons.calendar_month_outlined, Icons.calendar_month_rounded, languageProvider.t('appointments')),
      _NavItem(Icons.person_outline_rounded, Icons.person_rounded, languageProvider.t('profile')),
    ];

    // Regular user interface with floating nav bar using Stack
    return Scaffold(
      body: Stack(
        children: [
          // Main content
          IndexedStack(
            index: _currentIndex,
            children: _screens,
          ),
          // Floating navigation bar
          Positioned(
            left: 24,
            right: 24,
            bottom: MediaQuery.of(context).padding.bottom + 16,
            child: Container(
              height: 72,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppTheme.cardBackground,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryColor.withValues(alpha: 0.15),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                    spreadRadius: -4,
                  ),
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                    spreadRadius: -2,
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(navItems.length * 2 - 1, (i) {
                  // Add dividers between items (odd indices are dividers)
                  if (i.isOdd) {
                    return Container(
                      width: 1.5,
                      height: 32,
                      color: AppTheme.dividerColor,
                    );
                  }

                  final index = i ~/ 2;
                  final item = navItems[index];
                  final isSelected = _currentIndex == index;

                  return GestureDetector(
                    onTap: () => _onItemTapped(index),
                    behavior: HitTestBehavior.opaque,
                    child: AnimatedBuilder(
                      animation: _scaleAnimations[index],
                      builder: (context, child) {
                        return _NavBarItem(
                          item: item,
                          isSelected: isSelected,
                          scale: _scaleAnimations[index].value,
                          isRtl: languageProvider.languageCode == 'ar' || languageProvider.languageCode == 'he',
                        );
                      },
                    ),
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData selectedIcon;
  final String label;

  _NavItem(this.icon, this.selectedIcon, this.label);
}

class _NavBarItem extends StatelessWidget {
  final _NavItem item;
  final bool isSelected;
  final double scale;
  final bool isRtl;

  const _NavBarItem({
    required this.item,
    required this.isSelected,
    required this.scale,
    this.isRtl = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 70,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primaryColor.withValues(alpha: 0.12)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Transform.scale(
              scale: scale,
              child: Icon(
                isSelected ? item.selectedIcon : item.icon,
                color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
                size: 26,
              ),
            ),
          ),
          const SizedBox(height: 3),
          AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 200),
            style: TextStyle(
              fontSize: isRtl ? 12.5 : 11.5,
              fontWeight: isSelected
                  ? (isRtl ? FontWeight.w900 : FontWeight.w700)
                  : (isRtl ? FontWeight.w700 : FontWeight.w500),
              color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
              letterSpacing: isSelected ? 0.1 : 0,
            ),
            child: Text(
              item.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}

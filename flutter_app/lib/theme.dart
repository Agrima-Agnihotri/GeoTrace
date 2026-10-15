import 'package:flutter/material.dart';

/// One pastel palette used everywhere in the mobile app.
class Pastel {
  static const Color cream = Color(0xFFFBF8F3); // warm off-white background
  static const Color sky = Color(0xFFCFE3FA); // soft blue
  static const Color skyDeep = Color(0xFF5B8DB8);
  static const Color mint = Color(0xFFCDEEDD); // mint green
  static const Color mintDeep = Color(0xFF3F8F6B);
  static const Color peach = Color(0xFFFFE0C2);
  static const Color lavender = Color(0xFFE3DDF5);
  static const Color ink = Color(0xFF2B3A55);
  static const Color muted = Color(0xFF6B7A90);
  static const Color pipeBlue = Color(0xFF5B9BEA);
  static const Color jointOrange = Color(0xFFFF9A3C);
  static const Color warnOrange = Color(0xFFFFA24C);
  static const Color recordRed = Color(0xFFE5484D);
}

ThemeData buildPastelTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: Pastel.skyDeep,
    brightness: Brightness.light,
  ).copyWith(
    surface: Pastel.cream,
    onSurface: Pastel.ink,
    primary: Pastel.skyDeep,
    secondary: Pastel.mintDeep,
    primaryContainer: Pastel.sky,
    secondaryContainer: Pastel.mint,
    tertiaryContainer: Pastel.peach,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: Pastel.cream,
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: Pastel.mint,
      labelTextStyle: const WidgetStatePropertyAll(
        TextStyle(color: Pastel.ink, fontWeight: FontWeight.w600),
      ),
      iconTheme: const WidgetStatePropertyAll(IconThemeData(color: Pastel.ink)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: Pastel.sky,
        foregroundColor: Pastel.ink,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
  );
}

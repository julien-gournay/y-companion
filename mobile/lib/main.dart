import 'package:flutter/material.dart';
import 'bootstrap.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        useMaterial3: true,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF2F5E55),
          secondary: Color(0xFF35A29F),
        ),
        scaffoldBackgroundColor: const Color(0xFF0F1113),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF1B1D20),
          hintStyle: TextStyle(
            color: Colors.white.withAlpha((0.55 * 255).round()),
            fontSize: 14,
          ),
          labelStyle: TextStyle(
            color: Colors.white.withAlpha((0.7 * 255).round()),
            fontSize: 14,
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 18,
            vertical: 18,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(999),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(999),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(999),
            borderSide: BorderSide.none,
          ),
        ),
      ),
      home: const CampusBootstrap(),
    );
  }
}
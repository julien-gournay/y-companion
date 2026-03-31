import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/student_profile.dart';

const String _kHasProfileKey = 'campus_companion_has_profile';
const String _kProfileJsonKey = 'campus_companion_profile_json';

Future<StudentProfile?> loadProfile() async {
  final prefs = await SharedPreferences.getInstance();
  final hasProfile = prefs.getBool(_kHasProfileKey) ?? false;
  if (!hasProfile) return null;

  final raw = prefs.getString(_kProfileJsonKey);
  if (raw == null) return null;

  try {
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) return null;

    final profile = StudentProfile.fromJson(decoded);
    if (profile.nom.isEmpty || profile.prenom.isEmpty || profile.classe.isEmpty) {
      return null;
    }
    return profile;
  } catch (_) {
    return null;
  }
}

Future<void> saveProfile(StudentProfile profile) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_kProfileJsonKey, jsonEncode(profile.toJson()));
  await prefs.setBool(_kHasProfileKey, true);
}

Future<void> clearProfile() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove(_kProfileJsonKey);
  await prefs.setBool(_kHasProfileKey, false);
}


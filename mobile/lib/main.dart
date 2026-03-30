import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String _kHasProfileKey = 'campus_companion_has_profile';
const String _kProfileJsonKey = 'campus_companion_profile_json';

class StudentProfile {
  final String nom;
  final String prenom;
  final String classe;
  final String email;

  const StudentProfile({
    required this.nom,
    required this.prenom,
    required this.classe,
    required this.email,
  });

  Map<String, dynamic> toJson() => <String, dynamic>{
        'nom': nom,
        'prenom': prenom,
        'classe': classe,
        'email': email,
      };

  factory StudentProfile.fromJson(Map<String, dynamic> json) {
    return StudentProfile(
      nom: (json['nom'] ?? '').toString(),
      prenom: (json['prenom'] ?? '').toString(),
      classe: (json['classe'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
    );
  }
}

Future<StudentProfile?> _loadProfile() async {
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

Future<void> _saveProfile(StudentProfile profile) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_kProfileJsonKey, jsonEncode(profile.toJson()));
  await prefs.setBool(_kHasProfileKey, true);
}

Future<void> _clearProfile() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove(_kProfileJsonKey);
  await prefs.setBool(_kHasProfileKey, false);
}

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
            color: Colors.white.withOpacity(0.55),
            fontSize: 14,
          ),
          labelStyle: TextStyle(
            color: Colors.white.withOpacity(0.7),
            fontSize: 14,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
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
      home: const _Bootstrap(),
    );
  }
}

class _Bootstrap extends StatefulWidget {
  const _Bootstrap();

  @override
  State<_Bootstrap> createState() => _BootstrapState();
}

class _BootstrapState extends State<_Bootstrap> {
  StudentProfile? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final profile = await _loadProfile();
    if (!mounted) return;
    setState(() {
      _profile = profile;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_profile != null) {
      return CampusHomeScreen(
        profile: _profile!,
        onReset: () async {
          await _clearProfile();
          if (!mounted) return;
          setState(() => _profile = null);
        },
      );
    }

    return CampusOnboardingScreen(
      onProfileSaved: (profile) {
        setState(() => _profile = profile);
      },
    );
  }
}

class CampusOnboardingScreen extends StatefulWidget {
  final ValueChanged<StudentProfile> onProfileSaved;

  const CampusOnboardingScreen({
    super.key,
    required this.onProfileSaved,
  });

  @override
  State<CampusOnboardingScreen> createState() => _CampusOnboardingScreenState();
}

class _CampusOnboardingScreenState extends State<CampusOnboardingScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nomController = TextEditingController();
  final _prenomController = TextEditingController();
  final _emailController = TextEditingController();

  String? _selectedClasse;

  static const List<String> _classes = <String>[
    'Licence 1',
    'Licence 2',
    'Licence 3',
    'Master 1',
    'Master 2',
  ];

  @override
  void dispose() {
    _nomController.dispose();
    _prenomController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  InputDecoration _pillDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
    );
  }

  Future<void> _onSubmit() async {
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) return;
    final profile = StudentProfile(
      nom: _nomController.text.trim(),
      prenom: _prenomController.text.trim(),
      classe: _selectedClasse!,
      email: _emailController.text.trim(),
    );
    await _saveProfile(profile);
    widget.onProfileSaved(profile);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[Color(0xFF17191C), Color(0xFF0F1113)],
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: IntrinsicHeight(
                    child: Column(
                      children: <Widget>[
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 18,
                          ),
                          decoration: const BoxDecoration(
                            color: Color(0xFF2E3F3B),
                            borderRadius: BorderRadius.vertical(
                              top: Radius.circular(26),
                              bottom: Radius.circular(0),
                            ),
                          ),
                          child: const Text(
                            'Campus Companion',
                            textAlign: TextAlign.start,
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF61C7B5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),
                        const Text(
                          'Bienvenue ! Présentez-vous pour commencer.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.white70,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 22),
                        Form(
                          key: _formKey,
                          child: Column(
                            children: <Widget>[
                              TextFormField(
                                controller: _nomController,
                                decoration: _pillDecoration('Nom'),
                                keyboardType: TextInputType.name,
                                textInputAction: TextInputAction.next,
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Nom requis';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _prenomController,
                                decoration: _pillDecoration('Prénom'),
                                keyboardType: TextInputType.name,
                                textInputAction: TextInputAction.next,
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Prénom requis';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<String>(
                                value: _selectedClasse,
                                decoration: _pillDecoration('Classe'),
                                dropdownColor: const Color(0xFF1B1D20),
                                style: const TextStyle(color: Colors.white),
                                icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
                                items: _classes
                                    .map(
                                      (c) => DropdownMenuItem<String>(
                                        value: c,
                                        child: Text(c),
                                      ),
                                    )
                                    .toList(),
                                hint: const Text('Classe'),
                                onChanged: (value) {
                                  setState(() => _selectedClasse = value);
                                },
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Classe requise';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _emailController,
                                decoration: _pillDecoration('Email'),
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.done,
                                validator: (value) {
                                  final v = value?.trim() ?? '';
                                  if (v.isEmpty) return 'Email requis';
                                  final ok = v.contains('@') && v.contains('.');
                                  if (!ok) return 'Email invalide';
                                  return null;
                                },
                                onFieldSubmitted: (_) => _onSubmit(),
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        SizedBox(
                          height: 56,
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _onSubmit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2F5E55),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            child: const Text(
                              "C'est parti  →",
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class CampusHomeScreen extends StatelessWidget {
  final StudentProfile profile;
  final Future<void> Function() onReset;

  const CampusHomeScreen({
    super.key,
    required this.profile,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    final darkText = Colors.white.withOpacity(0.85);
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[Color(0xFF17191C), Color(0xFF0F1113)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 18,
                  ),
                  decoration: const BoxDecoration(
                    color: Color(0xFF2E3F3B),
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(26),
                      bottom: Radius.circular(0),
                    ),
                  ),
                  child: const Text(
                    'Campus Companion',
                    textAlign: TextAlign.start,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF61C7B5),
                    ),
                  ),
                ),
                const SizedBox(height: 26),
                Text(
                  'Bienvenue, ${profile.prenom} !',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1B1D20),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Colors.white.withOpacity(0.06)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text('Nom : ${profile.nom}', style: TextStyle(color: darkText)),
                      const SizedBox(height: 8),
                      Text('Prénom : ${profile.prenom}',
                          style: TextStyle(color: darkText)),
                      const SizedBox(height: 8),
                      Text('Classe : ${profile.classe}',
                          style: TextStyle(color: darkText)),
                      const SizedBox(height: 8),
                      Text('Email : ${profile.email}',
                          style: TextStyle(color: darkText)),
                    ],
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: onReset,
                  child: const Text(
                    'Réinitialiser',
                    style: TextStyle(
                      color: Color(0xFF35A29F),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../models/student_profile.dart';
import '../storage/profile_store.dart';

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

    await saveProfile(profile);
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
            colors: <Color>[
              Color(0xFF17191C),
              Color(0xFF0F1113),
            ],
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
                                icon: const Icon(
                                  Icons.keyboard_arrow_down,
                                  color: Colors.white,
                                ),
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


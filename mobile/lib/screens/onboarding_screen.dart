import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/student_profile.dart';
import '../storage/profile_store.dart';

class CampusOnboardingScreen extends StatefulWidget {
  final ValueChanged<StudentProfile> onProfileSaved;
  final VoidCallback? onSkip;

  const CampusOnboardingScreen({
    super.key,
    required this.onProfileSaved,
    this.onSkip,
  });

  @override
  State<CampusOnboardingScreen> createState() => _CampusOnboardingScreenState();
}

class _CampusOnboardingScreenState extends State<CampusOnboardingScreen> {
  final _formKey = GlobalKey<FormState>();

  final _prenomController = TextEditingController();
  final _nomController = TextEditingController();
  final _emailController = TextEditingController();

  String? _selectedClasse;

  static const List<String> _classes = <String>[
    'Licence 1',
    'Licence 2',
    'Licence 3',
    'Master 1',
    'Master 2',
  ];

  // Design colors
  static const Color _primaryGreen = Color(0xFF1F9E91);
  static const Color _darkColor = Color(0xFF0A0A0A);
  static const Color _lightGreen = Color(0xFFE5F8F5);
  static const Color _whiteColor = Color(0xFFF8F8F8);
  static const Color _hintColor = Color(0xFF474747);

  @override
  void dispose() {
    _prenomController.dispose();
    _nomController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.montserrat(
        color: _hintColor,
        fontSize: 10,
        fontWeight: FontWeight.w400,
      ),
      filled: true,
      fillColor: _lightGreen,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: _primaryGreen, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
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
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: _darkColor,
      body: Stack(
        children: [
          // Mascots - positioned in the dark area, will be partially hidden by green section
          Positioned(
            top: screenHeight * 0.40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Left mascot (smaller)
                Transform.translate(
                  offset: const Offset(20, 0),
                  child: Image.asset(
                    'assets/images/mascot1.png',
                    height: 100,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return const SizedBox(height: 100, width: 80);
                    },
                  ),
                ),
                // Right mascot (larger)
                Transform.translate(
                  offset: const Offset(-20, -15),
                  child: Image.asset(
                    'assets/images/mascot1.png',
                    height: 130,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return const SizedBox(height: 130, width: 100);
                    },
                  ),
                ),
              ],
            ),
          ),

          // Main layout
          Column(
            children: [
              // Top dark section - just logo and text
              SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),
                      // Ynov Logo
                      Image.asset(
                        'assets/images/ynov_logo.png',
                        height: 60,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return const SizedBox(height: 60);
                        },
                      ),
                      const SizedBox(height: 32),
                      // Title
                      Text(
                        'Y-compagnon',
                        style: GoogleFonts.montserrat(
                          fontSize: 32,
                          fontWeight: FontWeight.w600,
                          color: _whiteColor,
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Description
                      Text(
                        "Votre compagnon IA pour vos quesstions liés à la pédagogie et aux questions liés à l'informatique. Demandez lui ce que vous voulez, il vous répondera. Que ce soit une question de cours, de réseaux, de code, ou même d'anglais, Y-compagnon vous aidera à progresser. ",
                        style: GoogleFonts.montserrat(
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                          color: _whiteColor.withOpacity(0.85),
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Spacer to push green section down
              SizedBox(height: screenHeight * 0.20),

              // Bottom green section with form
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: _primaryGreen,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(40),
                      topRight: Radius.circular(40),
                    ),
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          // Prénom and Nom in a row
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _prenomController,
                                  decoration: _inputDecoration('Prénom'),
                                  style: GoogleFonts.montserrat(
                                    color: _hintColor,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  keyboardType: TextInputType.name,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Requis';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: TextFormField(
                                  controller: _nomController,
                                  decoration: _inputDecoration('Nom'),
                                  style: GoogleFonts.montserrat(
                                    color: _hintColor,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  keyboardType: TextInputType.name,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Requis';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          // Classe dropdown
                          DropdownButtonFormField<String>(
                            value: _selectedClasse,
                            decoration: _inputDecoration('Classe'),
                            dropdownColor: _lightGreen,
                            style: GoogleFonts.montserrat(
                              color: _hintColor,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                            icon: Icon(
                              Icons.keyboard_arrow_down,
                              color: _hintColor,
                            ),
                            items: _classes
                                .map(
                                  (c) => DropdownMenuItem<String>(
                                    value: c,
                                    child: Text(c),
                                  ),
                                )
                                .toList(),
                            hint: Text(
                              'Classe',
                              style: GoogleFonts.montserrat(
                                color: _hintColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
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
                          const SizedBox(height: 16),
                          // Email
                          TextFormField(
                            controller: _emailController,
                            decoration: _inputDecoration('E-mail'),
                            style: GoogleFonts.montserrat(
                              color: _hintColor,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
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
                          const SizedBox(height: 24),
                          // Se connecter button
                          SizedBox(
                            width: double.infinity,
                            height: 60,
                            child: ElevatedButton(
                              onPressed: _onSubmit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _darkColor,
                                foregroundColor: _whiteColor,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Se connecter',
                                    style: GoogleFonts.montserrat(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  const Icon(Icons.arrow_forward, size: 24),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 32),
                          // Divider
                          Container(
                            width: 40,
                            height: 3,
                            decoration: BoxDecoration(
                              color: _darkColor.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const SizedBox(height: 20),
                          // Continue without account
                          GestureDetector(
                            onTap: widget.onSkip,
                            child: RichText(
                              text: TextSpan(
                                style: GoogleFonts.montserrat(
                                  fontSize: 14,
                                  color: _whiteColor,
                                ),
                                children: [
                                  const TextSpan(
                                    text:
                                        "Utiliser l'application sans connexion? ",
                                  ),
                                  TextSpan(
                                    text: 'Continuer',
                                    style: GoogleFonts.montserrat(
                                      fontWeight: FontWeight.w600,
                                      color: _whiteColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          // Copyright
                          Text(
                            '@2026 ALL RIGHT RESERVED',
                            style: GoogleFonts.montserrat(
                              fontSize: 10,
                              fontWeight: FontWeight.w400,
                              color: _whiteColor.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

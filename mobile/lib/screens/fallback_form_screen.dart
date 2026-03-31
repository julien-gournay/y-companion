import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/student_profile.dart';
import '../services/ollama_config.dart';
import '../services/ticket_client.dart';

class FallbackFormScreen extends StatefulWidget {
  final StudentProfile profile;
  final String? initialQuestion;

  const FallbackFormScreen({
    super.key,
    required this.profile,
    this.initialQuestion,
  });

  @override
  State<FallbackFormScreen> createState() => _FallbackFormScreenState();
}

class _FallbackFormScreenState extends State<FallbackFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nomController;
  late final TextEditingController _prenomController;
  late final TextEditingController _classeController;
  late final TextEditingController _emailController;
  late final TextEditingController _messageController;

  bool _isSending = false;
  late final TicketClient _ticketClient;

  bool get _isGuest =>
      widget.profile.nom == 'Invité' ||
      (widget.profile.nom.isEmpty &&
          widget.profile.prenom.isEmpty &&
          widget.profile.email.isEmpty);

  @override
  void initState() {
    super.initState();
    _ticketClient = TicketClient(config: OllamaConfig.fromEnv());

    // Pré-remplir si l'utilisateur a un profil
    _nomController = TextEditingController(
      text: _isGuest ? '' : widget.profile.nom,
    );
    _prenomController = TextEditingController(
      text: _isGuest ? '' : widget.profile.prenom,
    );
    _classeController = TextEditingController(
      text: _isGuest ? '' : widget.profile.classe,
    );
    _emailController = TextEditingController(
      text: _isGuest ? '' : widget.profile.email,
    );
    _messageController = TextEditingController(
      text: widget.initialQuestion ?? '',
    );
  }

  @override
  void dispose() {
    _nomController.dispose();
    _prenomController.dispose();
    _classeController.dispose();
    _emailController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSending = true);

    try {
      final ticketId = await _ticketClient.sendFallback(
        question: _messageController.text.trim(),
        studentName: _nomController.text.trim(),
        studentFirstname: _prenomController.text.trim(),
        studentClass: _classeController.text.trim(),
        studentEmail: _emailController.text.trim(),
      );

      if (!mounted) return;
      Navigator.of(context).pop(ticketId);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
      setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryGreen = Color(0xFF1F9E91);
    const darkColor = Color(0xFF0A0A0A);

    return Scaffold(
      backgroundColor: darkColor,
      appBar: AppBar(
        backgroundColor: darkColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Contacter la pédagogie',
          style: GoogleFonts.montserrat(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  "L'IA n'a pas pu répondre à ta question ? Envoie un message à l'équipe pédagogique.",
                  style: GoogleFonts.montserrat(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 24),

                // Nom
                _buildTextField(
                  controller: _nomController,
                  label: 'Nom',
                  hint: 'Dupont',
                  enabled: _isGuest,
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Nom requis' : null,
                ),
                const SizedBox(height: 16),

                // Prénom
                _buildTextField(
                  controller: _prenomController,
                  label: 'Prénom',
                  hint: 'Lucas',
                  enabled: _isGuest,
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Prénom requis' : null,
                ),
                const SizedBox(height: 16),

                // Classe
                _buildTextField(
                  controller: _classeController,
                  label: 'Classe',
                  hint: 'B3 Dev',
                  enabled: _isGuest,
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Classe requise' : null,
                ),
                const SizedBox(height: 16),

                // Email
                _buildTextField(
                  controller: _emailController,
                  label: 'Email',
                  hint: 'lucas.dupont@student.ynov.com',
                  enabled: _isGuest,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Email requis';
                    if (!v.contains('@')) return 'Email invalide';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Message
                _buildTextField(
                  controller: _messageController,
                  label: 'Message',
                  hint: 'Décris ta question ou ton problème...',
                  maxLines: 5,
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Message requis' : null,
                ),
                const SizedBox(height: 32),

                // Bouton envoyer
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isSending ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryGreen,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isSending
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            'Envoyer',
                            style: GoogleFonts.montserrat(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    bool enabled = true,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    const primaryGreen = Color(0xFF1F9E91);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label,
          style: GoogleFonts.montserrat(
            color: Colors.white.withOpacity(0.9),
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          enabled: enabled,
          maxLines: maxLines,
          keyboardType: keyboardType,
          validator: validator,
          style: GoogleFonts.montserrat(
            color: enabled ? Colors.white : Colors.white.withOpacity(0.5),
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.montserrat(
              color: Colors.white.withOpacity(0.3),
            ),
            filled: true,
            fillColor: enabled
                ? const Color(0xFF1B1D20)
                : const Color(0xFF1B1D20).withOpacity(0.5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: primaryGreen),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.05)),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Colors.red),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';

import 'models/student_profile.dart';
import 'screens/chat_screen.dart';
import 'screens/onboarding_screen.dart';
import 'storage/profile_store.dart';

class CampusBootstrap extends StatefulWidget {
  const CampusBootstrap({super.key});

  @override
  State<CampusBootstrap> createState() => _CampusBootstrapState();
}

class _CampusBootstrapState extends State<CampusBootstrap> {
  StudentProfile? _profile;
  bool _loading = true;
  bool _isGuest = false;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final profile = await loadProfile();
    if (!mounted) return;

    setState(() {
      _profile = profile;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_profile != null || _isGuest) {
      return ChatScreen(
        profile:
            _profile ??
            const StudentProfile(
              nom: 'Invité',
              prenom: '',
              classe: '',
              email: '',
            ),
        onReset: () async {
          await clearProfile();
          if (!mounted) return;
          setState(() {
            _profile = null;
            _isGuest = false;
          });
        },
      );
    }

    return CampusOnboardingScreen(
      onProfileSaved: (profile) {
        setState(() => _profile = profile);
      },
      onSkip: () {
        setState(() => _isGuest = true);
      },
    );
  }
}

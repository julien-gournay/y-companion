// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/main.dart';

void main() {
  testWidgets('Onboarding is shown when no profile exists', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    expect(
      find.text('Bienvenue ! Présentez-vous pour commencer.'),
      findsOneWidget,
    );
  });

  testWidgets('Onboarding is skipped when profile exists', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({
      'campus_companion_has_profile': true,
      'campus_companion_profile_json': jsonEncode({
        'nom': 'Dupont',
        'prenom': 'Marie',
        'classe': 'Licence 1',
        'email': 'marie@example.com',
      }),
    });

    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    expect(find.text('Bienvenue, Marie !'), findsOneWidget);
  });
}

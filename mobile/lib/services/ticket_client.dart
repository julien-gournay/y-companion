import 'dart:convert';

import 'package:http/http.dart' as http;

import 'ollama_config.dart';

class TicketException implements Exception {
  final String message;
  final int? statusCode;

  const TicketException({required this.message, this.statusCode});

  @override
  String toString() => 'TicketException: $message';
}

class TicketClient {
  final OllamaConfig config;

  const TicketClient({required this.config});

  /// Envoie un ticket fallback quand l'IA ne sait pas répondre.
  Future<int> sendFallback({
    required String question,
    required String studentName,
    required String studentFirstname,
    required String studentClass,
    required String studentEmail,
  }) async {
    final url = Uri.parse('${config.baseUrl}/api/tickets/fallback');

    final response = await http.post(
      url,
      headers: const <String, String>{
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode(<String, String>{
        'question': question,
        'studentName': studentName,
        'studentFirstname': studentFirstname,
        'studentClass': studentClass,
        'studentEmail': studentEmail,
      }),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      final decoded = jsonDecode(response.body);
      return decoded['id'] as int? ?? 0;
    }

    throw TicketException(
      message: 'Impossible de créer le ticket',
      statusCode: response.statusCode,
    );
  }
}

import 'dart:convert';

import 'package:http/http.dart' as http;

import 'ollama_config.dart';

enum FeedbackType { up, down }

class FeedbackException implements Exception {
  final String message;
  final int? statusCode;

  const FeedbackException({required this.message, this.statusCode});

  @override
  String toString() => 'FeedbackException: $message';
}

class FeedbackClient {
  final OllamaConfig config;

  const FeedbackClient({required this.config});

  Future<void> sendFeedback({
    required int interactionId,
    required FeedbackType feedback,
  }) async {
    final url = Uri.parse(
      '${config.baseUrl}/api/interactions/$interactionId/feedback',
    );
    final feedbackValue = feedback == FeedbackType.up ? 'UP' : 'DOWN';

    final response = await http.patch(
      url,
      headers: const <String, String>{
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode(<String, String>{'feedback': feedbackValue}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw FeedbackException(
        message: 'Failed to send feedback',
        statusCode: response.statusCode,
      );
    }
  }
}

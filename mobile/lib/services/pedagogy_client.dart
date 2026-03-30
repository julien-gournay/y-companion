import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/student_profile.dart';
import 'pedagogy_config.dart';

class PedagogyApiException implements Exception {
  final String message;
  final Uri? uri;
  final int? statusCode;
  final String? responseBody;

  const PedagogyApiException({
    required this.message,
    this.uri,
    this.statusCode,
    this.responseBody,
  });

  @override
  String toString() {
    final code = statusCode == null ? '' : ' (statusCode=$statusCode)';
    return 'PedagogyApiException$code: $message';
  }
}

class PedagogySubmitQuestionResponse {
  final String? ticketId;

  const PedagogySubmitQuestionResponse({this.ticketId});

  static PedagogySubmitQuestionResponse fromJson(Map<String, dynamic> json) {
    final dynamic ticketId = json['ticketId'] ?? json['id'] ?? json['reference'];
    return PedagogySubmitQuestionResponse(
      ticketId: ticketId?.toString(),
    );
  }
}

/// Client HTTP pour envoyer une question à l'équipe pédagogique (backoffice).
///
/// Le schéma exact sera ajusté quand l'API sera finalisée.
class PedagogyClient {
  final PedagogyConfig config;

  const PedagogyClient({required this.config});

  Future<PedagogySubmitQuestionResponse> submitQuestion({
    required StudentProfile student,
    required String question,
    String? conversationId,
    List<Map<String, dynamic>>? chatContext,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    if (!config.isConfigured) {
      throw const PedagogyApiException(
        message:
            'API non configurée (PEDAGOGY_API_BASE_URL manquant).',
      );
    }

    final Uri url = config.submitQuestionUri;

    final Map<String, dynamic> body = <String, dynamic>{
      'student': student.toJson(),
      'question': question,
      'source': 'mobile',
      'conversationId': conversationId,
      'context': chatContext,
      'createdAtMs': DateTime.now().millisecondsSinceEpoch,
    }..removeWhere((_, v) => v == null);

    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (config.apiToken != null) {
      headers['Authorization'] = 'Bearer ${config.apiToken}';
    }

    final http.Response res = await http
        .post(
          url,
          headers: headers,
          body: jsonEncode(body),
        )
        .timeout(timeout);

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw PedagogyApiException(
        message: 'Pedagogy submitQuestion failed',
        uri: url,
        statusCode: res.statusCode,
        responseBody: res.body,
      );
    }

    if (res.body.trim().isEmpty) {
      return const PedagogySubmitQuestionResponse();
    }

    final dynamic decoded = jsonDecode(res.body);
    if (decoded is Map<String, dynamic>) {
      return PedagogySubmitQuestionResponse.fromJson(decoded);
    }

    // API peut répondre un simple id string.
    return PedagogySubmitQuestionResponse(ticketId: decoded.toString());
  }
}


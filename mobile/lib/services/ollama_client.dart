import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'ollama_config.dart';

class OllamaException implements Exception {
  final String message;
  final Uri? uri;
  final int? statusCode;
  final String? responseBody;

  const OllamaException({
    required this.message,
    this.uri,
    this.statusCode,
    this.responseBody,
  });

  @override
  String toString() {
    final code = statusCode == null ? '' : ' (statusCode=$statusCode)';
    return 'OllamaException$code: $message';
  }
}

class OllamaChatMessage {
  final String role; // 'user' | 'assistant' | 'system'
  final String content;

  const OllamaChatMessage({required this.role, required this.content});

  Map<String, dynamic> toJson() => <String, dynamic>{
    'role': role,
    'content': content,
  };
}

class DocumentSource {
  final String title;
  final String? downloadUrl;

  const DocumentSource({required this.title, this.downloadUrl});
}

class OllamaChatResponse {
  final String content;
  final List<DocumentSource> sources;
  final bool ticketCreated;
  final int? ticketId;
  final int? interactionId;
  final bool requiresStudentInfo;

  const OllamaChatResponse({
    required this.content,
    this.sources = const <DocumentSource>[],
    this.ticketCreated = false,
    this.ticketId,
    this.interactionId,
    this.requiresStudentInfo = false,
  });

  static OllamaChatResponse fromJson(Map<String, dynamic> json) {
    final dynamic answer = json['answer'] ?? json['response'];
    final sources = _readSources(json);
    return OllamaChatResponse(
      content: answer?.toString() ?? '',
      sources: sources,
      ticketCreated: json['ticketCreated'] == true,
      ticketId: _toIntOrNull(json['ticketId']),
      interactionId: _toIntOrNull(json['interactionId']),
      requiresStudentInfo: json['requiresStudentInfo'] == true,
    );
  }

  static List<DocumentSource> _readSources(Map<String, dynamic> json) {
    final direct = json['sources'];
    if (direct is List) {
      return direct
          .map((e) {
            if (e is Map) {
              final title = (e['title'] ?? '').toString().trim();
              final url = (e['downloadUrl'] ?? '').toString().trim();
              if (title.isEmpty && url.isEmpty) return null;
              return DocumentSource(
                title: title.isNotEmpty ? title : url,
                downloadUrl: url.isNotEmpty ? url : null,
              );
            }
            final str = e.toString().trim();
            if (str.isEmpty) return null;
            return DocumentSource(title: str);
          })
          .whereType<DocumentSource>()
          .toList();
    }
    return const <DocumentSource>[];
  }

  static int? _toIntOrNull(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }
}

/// Simple Ollama client (non-streaming).
///
/// This is "configured ahead" so the UI can be wired later.
class OllamaClient {
  final OllamaConfig config;

  const OllamaClient({required this.config});

  Future<OllamaChatResponse> chat({
    required List<OllamaChatMessage> messages,
    String? sessionId,
    int? userId,
    Duration timeout = const Duration(seconds: 60),
  }) async {
    final Uri url = config.chatUri;
    final question = _extractLastUserQuestion(messages);
    if (question.trim().isEmpty) {
      throw const OllamaException(message: 'Question utilisateur introuvable.');
    }
    final Map<String, dynamic> body = <String, dynamic>{
      'question': question.trim(),
      'sessionId': sessionId,
      'userId': userId,
    }..removeWhere((_, v) => v == null);

    final http.Response res = await http
        .post(
          url,
          headers: const <String, String>{
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: jsonEncode(body),
        )
        .timeout(timeout);

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw OllamaException(
        message: 'Ollama chat request failed',
        uri: url,
        statusCode: res.statusCode,
        responseBody: res.body,
      );
    }

    final dynamic decoded = jsonDecode(res.body);
    if (decoded is! Map<String, dynamic>) {
      throw OllamaException(
        message: 'Unexpected Campus API chat response format',
        uri: url,
        statusCode: res.statusCode,
        responseBody: res.body,
      );
    }

    return OllamaChatResponse.fromJson(decoded);
  }

  /// Convenience wrapper that returns only the assistant text.
  Future<String> chatText({
    required List<OllamaChatMessage> messages,
    String? sessionId,
    int? userId,
    Duration timeout = const Duration(seconds: 60),
  }) async {
    final resp = await chat(
      messages: messages,
      sessionId: sessionId,
      userId: userId,
      timeout: timeout,
    );
    return resp.content;
  }

  String _extractLastUserQuestion(List<OllamaChatMessage> messages) {
    for (var i = messages.length - 1; i >= 0; i--) {
      final m = messages[i];
      if (m.role != 'user') continue;
      if (m.content.trim().isEmpty) continue;
      return m.content;
    }
    return '';
  }
}

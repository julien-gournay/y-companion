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

  const OllamaChatMessage({
    required this.role,
    required this.content,
  });

  Map<String, dynamic> toJson() => <String, dynamic>{
        'role': role,
        'content': content,
      };
}

class OllamaChatResponse {
  final String content;
  final List<String> sources;

  const OllamaChatResponse({required this.content, this.sources = const <String>[]});

  static OllamaChatResponse fromJson(Map<String, dynamic> json) {
    final dynamic message = json['message'];
    final sources = _readSources(json);
    if (message is Map) {
      final content = (message['content'] ?? '').toString();
      return OllamaChatResponse(content: content, sources: sources);
    }

    // Fallback: some endpoints/versions use `response` instead.
    final dynamic response = json['response'];
    if (response != null) {
      return OllamaChatResponse(content: response.toString(), sources: sources);
    }

    return OllamaChatResponse(content: '', sources: sources);
  }

  static List<String> _readSources(Map<String, dynamic> json) {
    final direct = json['sources'];
    if (direct is List) {
      return direct.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList();
    }

    // Some wrappers put metadata under a "context" object.
    final context = json['context'];
    if (context is Map) {
      final nested = context['sources'];
      if (nested is List) {
        return nested.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList();
      }
    }
    return const <String>[];
  }
}

class OllamaGenerateResponse {
  final String content;

  const OllamaGenerateResponse({required this.content});

  static OllamaGenerateResponse fromJson(Map<String, dynamic> json) {
    final dynamic response = json['response'];
    if (response != null) {
      return OllamaGenerateResponse(content: response.toString());
    }
    return const OllamaGenerateResponse(content: '');
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
    double temperature = 0.2,
    int? numPredict,
    Duration timeout = const Duration(seconds: 60),
  }) async {
    final Uri url = config.chatUri;

    final Map<String, dynamic> options = <String, dynamic>{
      'temperature': temperature,
      'num_predict': numPredict,
    }..removeWhere((_, v) => v == null);

    final Map<String, dynamic> body = <String, dynamic>{
      'model': config.model,
      'messages': messages.map((m) => m.toJson()).toList(),
      'stream': false,
      'options': options,
    };

    final http.Response res = await http
        .post(
          url,
          headers: const <String, String>{
            'Content-Type': 'application/json',
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
        message: 'Unexpected Ollama chat response format',
        uri: url,
        statusCode: res.statusCode,
        responseBody: res.body,
      );
    }

    return OllamaChatResponse.fromJson(decoded);
  }

  Future<OllamaGenerateResponse> generate({
    required String prompt,
    double temperature = 0.2,
    int? numPredict,
    Duration timeout = const Duration(seconds: 60),
  }) async {
    final Uri url = Uri.parse('${config.baseUrl}/api/generate');

    final Map<String, dynamic> options = <String, dynamic>{
      'temperature': temperature,
      'num_predict': numPredict,
    }..removeWhere((_, v) => v == null);

    final Map<String, dynamic> body = <String, dynamic>{
      'model': config.model,
      'prompt': prompt,
      'stream': false,
      'options': options,
    };

    final http.Response res = await http
        .post(
          url,
          headers: const <String, String>{
            'Content-Type': 'application/json',
          },
          body: jsonEncode(body),
        )
        .timeout(timeout);

    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw OllamaException(
        message: 'Ollama generate request failed',
        uri: url,
        statusCode: res.statusCode,
        responseBody: res.body,
      );
    }

    final dynamic decoded = jsonDecode(res.body);
    if (decoded is! Map<String, dynamic>) {
      throw OllamaException(
        message: 'Unexpected Ollama generate response format',
        uri: url,
        statusCode: res.statusCode,
        responseBody: res.body,
      );
    }

    return OllamaGenerateResponse.fromJson(decoded);
  }

  /// Convenience wrapper that returns only the assistant text.
  Future<String> chatText({
    required List<OllamaChatMessage> messages,
    double temperature = 0.2,
    int? numPredict,
    Duration timeout = const Duration(seconds: 60),
  }) async {
    final resp = await chat(
      messages: messages,
      temperature: temperature,
      numPredict: numPredict,
      timeout: timeout,
    );
    return resp.content;
  }
}


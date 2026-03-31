import 'dart:convert';
import 'package:http/http.dart' as http;
import 'ollama_config.dart';

/// Client pour récupérer les notifications (interactions avec tickets résolus)
class NotificationsClient {
  final String baseUrl;

  NotificationsClient({String? baseUrl})
    : baseUrl = baseUrl ?? OllamaConfig.fromEnv().baseUrl;

  /// Récupère les interactions avec tickets résolus pour une session
  Future<List<TicketNotification>> getNotificationsBySessionId(
    String sessionId,
  ) async {
    final uri = Uri.parse('$baseUrl/api/interactions').replace(
      queryParameters: {'sessionId': sessionId},
    );

    final response = await http.get(
      uri,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      // Filtrer les interactions qui ont un ticket avec réponse
      final notifications = <TicketNotification>[];
      
      for (final json in data) {
        final ticketId = json['ticketId'];
        if (ticketId != null) {
          // Récupérer les détails du ticket
          try {
            final ticket = await _getTicketDetails(ticketId);
            if (ticket != null && ticket.answerFromTeacher.isNotEmpty) {
              notifications.add(ticket.copyWith(
                question: json['userQuestion'] as String? ?? '',
              ));
            }
          } catch (_) {
            // Ignorer les erreurs de ticket individuel
          }
        }
      }
      return notifications;
    } else if (response.statusCode == 401 || response.statusCode == 403) {
      // Endpoint protégé - retourner liste vide
      return [];
    } else {
      throw Exception('Erreur: ${response.statusCode}');
    }
  }

  /// Récupère les détails d'un ticket
  Future<TicketNotification?> _getTicketDetails(int ticketId) async {
    final uri = Uri.parse('$baseUrl/api/tickets/$ticketId');

    final response = await http.get(
      uri,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return TicketNotification.fromJson(json);
    }
    return null;
  }

  /// Récupère les tickets résolus pour un email étudiant (fallback)
  Future<List<TicketNotification>> getResolvedTickets(String studentEmail) async {
    final uri = Uri.parse('$baseUrl/api/tickets').replace(
      queryParameters: {'status': 'RESOLVED'},
    );

    final response = await http.get(
      uri,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data
          .map((json) => TicketNotification.fromJson(json))
          .where((ticket) =>
              ticket.studentEmail.toLowerCase() == studentEmail.toLowerCase())
          .toList();
    } else if (response.statusCode == 401 || response.statusCode == 403) {
      return [];
    } else {
      throw Exception('Erreur: ${response.statusCode}');
    }
  }
}

/// Modèle pour une notification de ticket résolu
class TicketNotification {
  final int id;
  final String question;
  final String answerFromTeacher;
  final String studentEmail;
  final String? studentName;
  final String? studentFirstname;
  final DateTime? answeredAt;
  final DateTime createdAt;

  TicketNotification({
    required this.id,
    required this.question,
    required this.answerFromTeacher,
    required this.studentEmail,
    this.studentName,
    this.studentFirstname,
    this.answeredAt,
    required this.createdAt,
  });

  TicketNotification copyWith({String? question}) {
    return TicketNotification(
      id: id,
      question: question ?? this.question,
      answerFromTeacher: answerFromTeacher,
      studentEmail: studentEmail,
      studentName: studentName,
      studentFirstname: studentFirstname,
      answeredAt: answeredAt,
      createdAt: createdAt,
    );
  }

  factory TicketNotification.fromJson(Map<String, dynamic> json) {
    return TicketNotification(
      id: json['id'] as int,
      question: json['question'] as String? ?? '',
      answerFromTeacher: json['answerFromTeacher'] as String? ?? '',
      studentEmail: json['studentEmail'] as String? ?? '',
      studentName: json['studentName'] as String?,
      studentFirstname: json['studentFirstname'] as String?,
      answeredAt: json['answeredAt'] != null
          ? DateTime.parse(json['answeredAt'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}

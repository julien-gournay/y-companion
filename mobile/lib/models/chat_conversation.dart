class ChatMessage {
  final String role; // "user" | "assistant" | "status"
  final String text;
  final String? metaText;
  final List<String>? emojiRow;
  final String? subtitle;
  final int createdAtMs;

  const ChatMessage({
    required this.role,
    required this.text,
    required this.createdAtMs,
    this.metaText,
    this.emojiRow,
    this.subtitle,
  });

  Map<String, dynamic> toJson() => <String, dynamic>{
        'role': role,
        'text': text,
        'metaText': metaText,
        'emojiRow': emojiRow,
        'subtitle': subtitle,
        'createdAtMs': createdAtMs,
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    final emoji = json['emojiRow'];
    return ChatMessage(
      role: (json['role'] ?? 'user').toString(),
      text: (json['text'] ?? '').toString(),
      metaText: json['metaText']?.toString(),
      emojiRow: emoji is List ? emoji.map((e) => e.toString()).toList() : null,
      subtitle: json['subtitle']?.toString(),
      createdAtMs: (json['createdAtMs'] is int)
          ? json['createdAtMs'] as int
          : int.tryParse((json['createdAtMs'] ?? '0').toString()) ?? 0,
    );
  }
}

class ChatConversation {
  final String id;
  final String title;
  final int createdAtMs;
  final int updatedAtMs;
  final List<ChatMessage> messages;

  const ChatConversation({
    required this.id,
    required this.title,
    required this.createdAtMs,
    required this.updatedAtMs,
    required this.messages,
  });

  String? get lastPreview {
    if (messages.isEmpty) return null;
    final last = messages.last;
    final t = last.text.trim();
    return t.isEmpty ? null : t;
  }

  ChatConversation copyWith({
    String? title,
    int? updatedAtMs,
    List<ChatMessage>? messages,
  }) {
    return ChatConversation(
      id: id,
      title: title ?? this.title,
      createdAtMs: createdAtMs,
      updatedAtMs: updatedAtMs ?? this.updatedAtMs,
      messages: messages ?? this.messages,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'createdAtMs': createdAtMs,
        'updatedAtMs': updatedAtMs,
        'messages': messages.map((m) => m.toJson()).toList(),
      };

  factory ChatConversation.fromJson(Map<String, dynamic> json) {
    final rawMessages = json['messages'];
    final messages = rawMessages is List
        ? rawMessages
            .whereType<Map>()
            .map((m) => ChatMessage.fromJson(m.cast<String, dynamic>()))
            .toList()
        : <ChatMessage>[];

    return ChatConversation(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? 'Conversation').toString(),
      createdAtMs: (json['createdAtMs'] is int)
          ? json['createdAtMs'] as int
          : int.tryParse((json['createdAtMs'] ?? '0').toString()) ?? 0,
      updatedAtMs: (json['updatedAtMs'] is int)
          ? json['updatedAtMs'] as int
          : int.tryParse((json['updatedAtMs'] ?? '0').toString()) ?? 0,
      messages: messages,
    );
  }
}


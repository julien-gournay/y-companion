class StoredSource {
  final String title;
  final String? downloadUrl;

  const StoredSource({required this.title, this.downloadUrl});

  Map<String, dynamic> toJson() => <String, dynamic>{
    'title': title,
    'downloadUrl': downloadUrl,
  };

  factory StoredSource.fromJson(Map<String, dynamic> json) {
    return StoredSource(
      title: (json['title'] ?? '').toString(),
      downloadUrl: json['downloadUrl']?.toString(),
    );
  }
}

class ChatMessage {
  final String role; // "user" | "assistant" | "status"
  final String text;
  final String? metaText;
  final List<String>? emojiRow;
  final String? subtitle;
  final int createdAtMs;
  final int? interactionId;
  final String? feedback; // "UP" | "DOWN" | null
  final List<StoredSource>? sources;

  const ChatMessage({
    required this.role,
    required this.text,
    required this.createdAtMs,
    this.metaText,
    this.emojiRow,
    this.subtitle,
    this.interactionId,
    this.feedback,
    this.sources,
  });

  ChatMessage copyWith({String? feedback}) {
    return ChatMessage(
      role: role,
      text: text,
      createdAtMs: createdAtMs,
      metaText: metaText,
      emojiRow: emojiRow,
      subtitle: subtitle,
      interactionId: interactionId,
      feedback: feedback ?? this.feedback,
      sources: sources,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
    'role': role,
    'text': text,
    'metaText': metaText,
    'emojiRow': emojiRow,
    'subtitle': subtitle,
    'createdAtMs': createdAtMs,
    'interactionId': interactionId,
    'feedback': feedback,
    'sources': sources?.map((s) => s.toJson()).toList(),
  };

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    final emoji = json['emojiRow'];
    final rawSources = json['sources'];
    List<StoredSource>? sources;
    if (rawSources is List) {
      sources = rawSources
          .whereType<Map>()
          .map((s) => StoredSource.fromJson(s.cast<String, dynamic>()))
          .toList();
      if (sources.isEmpty) sources = null;
    }

    return ChatMessage(
      role: (json['role'] ?? 'user').toString(),
      text: (json['text'] ?? '').toString(),
      metaText: json['metaText']?.toString(),
      emojiRow: emoji is List ? emoji.map((e) => e.toString()).toList() : null,
      subtitle: json['subtitle']?.toString(),
      createdAtMs: (json['createdAtMs'] is int)
          ? json['createdAtMs'] as int
          : int.tryParse((json['createdAtMs'] ?? '0').toString()) ?? 0,
      interactionId: json['interactionId'] is int
          ? json['interactionId'] as int
          : int.tryParse((json['interactionId'] ?? '').toString()),
      feedback: json['feedback']?.toString(),
      sources: sources,
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

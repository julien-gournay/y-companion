import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/chat_conversation.dart';

const String _kConversationsJsonKey = 'campus_companion_chat_conversations_json';
const String _kActiveConversationIdKey =
    'campus_companion_chat_active_conversation_id';

const int _kMaxConversations = 50;
const int _kMaxMessagesPerConversation = 200;

Future<List<ChatConversation>> loadConversations() async {
  final prefs = await SharedPreferences.getInstance();
  final raw = prefs.getString(_kConversationsJsonKey);
  if (raw == null || raw.trim().isEmpty) return <ChatConversation>[];

  try {
    final decoded = jsonDecode(raw);
    if (decoded is! List) return <ChatConversation>[];
    return decoded
        .whereType<Map>()
        .map((c) => ChatConversation.fromJson(c.cast<String, dynamic>()))
        .where((c) => c.id.isNotEmpty)
        .toList()
      ..sort((a, b) => b.updatedAtMs.compareTo(a.updatedAtMs));
  } catch (_) {
    return <ChatConversation>[];
  }
}

Future<void> saveConversations(List<ChatConversation> conversations) async {
  final trimmed = conversations
      .map((c) {
        final msgs = c.messages.length > _kMaxMessagesPerConversation
            ? c.messages.sublist(c.messages.length - _kMaxMessagesPerConversation)
            : c.messages;
        return c.copyWith(messages: msgs);
      })
      .toList()
    ..sort((a, b) => b.updatedAtMs.compareTo(a.updatedAtMs));

  final capped =
      trimmed.length > _kMaxConversations ? trimmed.sublist(0, _kMaxConversations) : trimmed;

  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(
    _kConversationsJsonKey,
    jsonEncode(capped.map((c) => c.toJson()).toList()),
  );
}

Future<String?> loadActiveConversationId() async {
  final prefs = await SharedPreferences.getInstance();
  final v = prefs.getString(_kActiveConversationIdKey);
  if (v == null || v.trim().isEmpty) return null;
  return v;
}

Future<void> setActiveConversationId(String? id) async {
  final prefs = await SharedPreferences.getInstance();
  if (id == null || id.trim().isEmpty) {
    await prefs.remove(_kActiveConversationIdKey);
    return;
  }
  await prefs.setString(_kActiveConversationIdKey, id);
}

Future<void> clearChatHistory() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove(_kConversationsJsonKey);
  await prefs.remove(_kActiveConversationIdKey);
}


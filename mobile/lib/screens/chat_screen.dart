import 'package:flutter/material.dart';

import '../models/chat_conversation.dart';
import '../models/student_profile.dart';
import '../screens/chat_history_screen.dart';
import '../services/ollama_client.dart';
import '../services/ollama_config.dart';
import '../storage/chat_store.dart';

enum _ChatMessageType { user, assistant, status }

class _ChatMessage {
  final _ChatMessageType type;
  final String text;
  final String? metaText;
  final List<String>? emojiRow;
  final String? subtitle;

  const _ChatMessage._({
    required this.type,
    required this.text,
    this.metaText,
    this.emojiRow,
    this.subtitle,
  });

  factory _ChatMessage.user(String text) =>
      _ChatMessage._(type: _ChatMessageType.user, text: text);

  factory _ChatMessage.assistant({
    required String text,
    String? metaText,
    List<String>? emojiRow,
  }) => _ChatMessage._(
    type: _ChatMessageType.assistant,
    text: text,
    metaText: metaText,
    emojiRow: emojiRow,
  );

  factory _ChatMessage.status({
    required String title,
    required String subtitle,
  }) => _ChatMessage._(
    type: _ChatMessageType.status,
    text: title,
    subtitle: subtitle,
  );
}

class ChatScreen extends StatefulWidget {
  final StudentProfile profile;
  final Future<void> Function() onReset;

  const ChatScreen({super.key, required this.profile, required this.onReset});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<_ChatMessage> _messages = <_ChatMessage>[];
  bool _isSending = false;
  bool _loadingConversation = true;

  List<ChatConversation> _conversations = <ChatConversation>[];
  String? _conversationId;
  late final OllamaClient _ollamaClient;

  @override
  void initState() {
    super.initState();
    _ollamaClient = OllamaClient(config: OllamaConfig.fromEnv());
    _bootConversation();
  }

  Future<void> _bootConversation() async {
    final conversations = await loadConversations();
    final activeId = await loadActiveConversationId();

    if (!mounted) return;
    setState(() {
      _conversations = conversations;
    });

    ChatConversation? existing;
    if (activeId != null) {
      for (final c in conversations) {
        if (c.id == activeId) {
          existing = c;
          break;
        }
      }
    }

    if (existing != null) {
      await _openConversation(existing.id);
      return;
    }

    await _startNewConversation();
  }

  Future<void> _startNewConversation() async {
    final id = DateTime.now().microsecondsSinceEpoch.toString();
    final now = DateTime.now().millisecondsSinceEpoch;
    final conversation = ChatConversation(
      id: id,
      title: 'Nouvelle conversation',
      createdAtMs: now,
      updatedAtMs: now,
      messages: const <ChatMessage>[],
    );

    final updated = <ChatConversation>[conversation, ..._conversations]
      ..sort((a, b) => b.updatedAtMs.compareTo(a.updatedAtMs));
    await saveConversations(updated);
    await setActiveConversationId(id);

    if (!mounted) return;
    setState(() {
      _conversations = updated;
      _conversationId = id;
      _messages
        ..clear();
      _loadingConversation = false;
    });
  }

  Future<void> _openConversation(String id) async {
    ChatConversation? c;
    for (final x in _conversations) {
      if (x.id == id) {
        c = x;
        break;
      }
    }
    if (c == null) {
      await _startNewConversation();
      return;
    }

    final msgs = c.messages.map(_fromStoredMessage).toList();
    await setActiveConversationId(id);

    if (!mounted) return;
    setState(() {
      _conversationId = id;
      _messages
        ..clear()
        ..addAll(msgs);
      _loadingConversation = false;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  _ChatMessage _fromStoredMessage(ChatMessage m) {
    switch (m.role) {
      case 'assistant':
        return _ChatMessage.assistant(text: m.text, metaText: m.metaText, emojiRow: m.emojiRow);
      case 'status':
        return _ChatMessage.status(title: m.text, subtitle: m.subtitle ?? '');
      case 'user':
      default:
        return _ChatMessage.user(m.text);
    }
  }

  ChatMessage _toStoredMessage(_ChatMessage m) {
    final now = DateTime.now().millisecondsSinceEpoch;
    switch (m.type) {
      case _ChatMessageType.assistant:
        return ChatMessage(
          role: 'assistant',
          text: m.text,
          metaText: m.metaText,
          emojiRow: m.emojiRow,
          createdAtMs: now,
        );
      case _ChatMessageType.status:
        return ChatMessage(
          role: 'status',
          text: m.text,
          subtitle: m.subtitle,
          createdAtMs: now,
        );
      case _ChatMessageType.user:
        return ChatMessage(role: 'user', text: m.text, createdAtMs: now);
    }
  }

  String _deriveTitle(List<_ChatMessage> messages) {
    for (final m in messages) {
      if (m.type == _ChatMessageType.user) {
        final t = m.text.trim();
        if (t.isEmpty) continue;
        return t.length > 42 ? '${t.substring(0, 42)}…' : t;
      }
    }
    return 'Nouvelle conversation';
  }

  Future<void> _persistCurrentConversation() async {
    final id = _conversationId;
    if (id == null) return;
    final now = DateTime.now().millisecondsSinceEpoch;
    final storedMessages = _messages.map(_toStoredMessage).toList();
    final title = _deriveTitle(_messages);

    final existingIndex = _conversations.indexWhere((c) => c.id == id);
    final updatedConversation = ChatConversation(
      id: id,
      title: title,
      createdAtMs: existingIndex >= 0 ? _conversations[existingIndex].createdAtMs : now,
      updatedAtMs: now,
      messages: storedMessages,
    );

    final updated = <ChatConversation>[
      updatedConversation,
      ..._conversations.where((c) => c.id != id),
    ]..sort((a, b) => b.updatedAtMs.compareTo(a.updatedAtMs));

    _conversations = updated;
    await saveConversations(updated);
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) return;
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  Future<void> _send() async {
    final raw = _inputController.text;
    final content = raw.trim();
    if (content.isEmpty || _isSending) return;

    setState(() {
      _isSending = true;
      _messages.add(_ChatMessage.user(content));
    });
    await _persistCurrentConversation();
    _inputController.clear();
    _scrollToBottom();

    try {
      final response = await _ollamaClient.chat(
        messages: _toOllamaMessages(),
        temperature: 0.2,
      );
      if (!mounted) return;

      setState(() {
        _messages.add(
          _ChatMessage.assistant(
            text: response.content.trim().isEmpty
                ? "Je n'ai pas pu generer une reponse exploitable."
                : response.content.trim(),
            metaText: _formatSources(response.sources),
          ),
        );
        _isSending = false;
      });
      await _persistCurrentConversation();
      _scrollToBottom();
    } on OllamaException catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.add(
          _ChatMessage.status(
            title: 'Erreur Ollama',
            subtitle: _humanizeOllamaError(e),
          ),
        );
        _isSending = false;
      });
      await _persistCurrentConversation();
      _scrollToBottom();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _messages.add(
          _ChatMessage.status(
            title: 'Erreur',
            subtitle: "Impossible d'obtenir la reponse d'Ollama.",
          ),
        );
        _isSending = false;
      });
      await _persistCurrentConversation();
      _scrollToBottom();
    }
  }

  List<OllamaChatMessage> _toOllamaMessages() {
    final mapped = <OllamaChatMessage>[
      const OllamaChatMessage(
        role: 'system',
        content:
            "Tu es Campus Companion. Reponds en francais, de maniere concise. Si des sources sont disponibles, conserve-les.",
      ),
    ];
    for (final m in _messages) {
      if (m.type == _ChatMessageType.status) continue;
      mapped.add(
        OllamaChatMessage(
          role: m.type == _ChatMessageType.user ? 'user' : 'assistant',
          content: m.text,
        ),
      );
    }
    return mapped;
  }

  String? _formatSources(List<String> sources) {
    if (sources.isEmpty) return null;
    return 'Sources: ${sources.join(' | ')}';
  }

  String _humanizeOllamaError(OllamaException e) {
    if (e.statusCode == null) {
      return "Connexion impossible. Verifie l'URL OLLAMA_BASE_URL (localhost n'est pas accessible depuis un mobile physique).";
    }
    return "Echec Ollama (${e.statusCode}).";
  }

  Future<void> _openHistory() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ChatHistoryScreen(
          onOpenConversation: (c) => _openConversation(c.id),
          onNewConversation: _startNewConversation,
        ),
      ),
    );

    final refreshed = await loadConversations();
    if (!mounted) return;
    setState(() => _conversations = refreshed);
  }

  Future<bool> _confirmDanger({
    required String title,
    required String message,
    required String confirmLabel,
  }) async {
    final res = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1B1D20),
          title: Text(title, style: const TextStyle(color: Colors.white)),
          content: Text(message, style: TextStyle(color: Colors.white.withOpacity(0.75))),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Annuler', style: TextStyle(color: Colors.white)),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(confirmLabel, style: const TextStyle(color: Color(0xFF61C7B5))),
            ),
          ],
        );
      },
    );
    return res ?? false;
  }

  Future<void> _deleteCurrentConversation() async {
    final id = _conversationId;
    if (id == null || id.trim().isEmpty) {
      await _startNewConversation();
      return;
    }

    final ok = await _confirmDanger(
      title: 'Supprimer cette conversation ?',
      message: "Cette action est irreversible. La conversation en cours sera supprimée de l'historique.",
      confirmLabel: 'Supprimer',
    );
    if (!ok) return;

    await deleteConversationById(id);
    final refreshed = await loadConversations();
    if (!mounted) return;

    if (refreshed.isEmpty) {
      setState(() {
        _conversations = <ChatConversation>[];
        _conversationId = null;
        _messages.clear();
        _loadingConversation = true;
      });
      await _startNewConversation();
      return;
    }

    setState(() {
      _conversations = refreshed;
      _loadingConversation = true;
    });
    await _openConversation(refreshed.first.id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[Color(0xFF17191C), Color(0xFF0F1113)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 10,
                ),
                child: Row(
                  children: <Widget>[
                    Icon(
                      Icons.chat_bubble_outline,
                      color: const Color(0xFF61C7B5).withOpacity(0.95),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'Campus Companion',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Color.fromRGBO(255, 255, 255, 0.9),
                        ),
                      ),
                    ),
                    Stack(
                      clipBehavior: Clip.none,
                      children: <Widget>[
                        IconButton(
                          icon: const Icon(Icons.notifications_none),
                          color: Colors.white.withOpacity(0.8),
                          onPressed: () {},
                        ),
                        Positioned(
                          right: 7,
                          top: 7,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color(0xFF35A29F),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      icon: const Icon(Icons.history),
                      color: Colors.white.withOpacity(0.8),
                      onPressed: _openHistory,
                    ),
                    PopupMenuButton<int>(
                      color: const Color(0xFF1B1D20),
                      onSelected: (value) async {
                        if (value == 0) {
                          final ok = await _confirmDanger(
                            title: 'Réinitialiser ?',
                            message:
                                "Cela réinitialise l'application et efface tout l'historique des conversations.",
                            confirmLabel: 'Réinitialiser',
                          );
                          if (!ok) return;
                          await widget.onReset();
                          await clearChatHistory();
                          if (!mounted) return;
                          setState(() {
                            _conversations = <ChatConversation>[];
                            _conversationId = null;
                            _messages.clear();
                            _loadingConversation = true;
                          });
                          await _startNewConversation();
                        }
                        if (value == 1) {
                          final ok = await _confirmDanger(
                            title: "Effacer tout l'historique ?",
                            message:
                                "Toutes les conversations seront supprimées. Cette action est irreversible.",
                            confirmLabel: 'Effacer',
                          );
                          if (!ok) return;
                          await clearChatHistory();
                          if (!mounted) return;
                          setState(() {
                            _conversations = <ChatConversation>[];
                            _conversationId = null;
                            _messages.clear();
                            _loadingConversation = true;
                          });
                          await _startNewConversation();
                        }
                        if (value == 2) {
                          await _deleteCurrentConversation();
                        }
                      },
                      itemBuilder: (context) => <PopupMenuEntry<int>>[
                        const PopupMenuItem<int>(
                          value: 0,
                          child: Text(
                            'Réinitialiser',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                        const PopupMenuItem<int>(
                          value: 1,
                          child: Text(
                            "Effacer tout l'historique",
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                        const PopupMenuItem<int>(
                          value: 2,
                          child: Text(
                            'Supprimer cette conversation',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                      icon: const Icon(Icons.more_vert),
                    ),
                  ],
                ),
              ),
              Divider(
                height: 1,
                thickness: 0.4,
                color: Colors.white.withOpacity(0.10),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 14, 18, 6),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Bienvenue, ${widget.profile.prenom} !',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.88),
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              Expanded(
                child: _loadingConversation
                    ? const Center(child: CircularProgressIndicator())
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          switch (msg.type) {
                            case _ChatMessageType.user:
                              return _UserBubble(text: msg.text);
                            case _ChatMessageType.assistant:
                              return _AssistantBubble(
                                text: msg.text,
                                metaText: msg.metaText,
                                emojiRow: msg.emojiRow,
                              );
                            case _ChatMessageType.status:
                              return _StatusCard(
                                title: msg.text,
                                subtitle: msg.subtitle ?? '',
                              );
                          }
                        },
                      ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1B1D20),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white.withOpacity(0.06)),
                  ),
                  child: Row(
                    children: <Widget>[
                      Expanded(
                        child: TextField(
                          controller: _inputController,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            hintText: 'Message...',
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 14,
                            ),
                          ),
                          minLines: 1,
                          maxLines: 3,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _send(),
                        ),
                      ),
                      const SizedBox(width: 6),
                      SizedBox(
                        width: 42,
                        height: 42,
                        child: FloatingActionButton(
                          onPressed: _send,
                          backgroundColor: const Color(0xFF2F5E55),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: const CircleBorder(),
                          child: _isSending
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.send),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _UserBubble extends StatelessWidget {
  final String text;

  const _UserBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          color: Color(0xFF2F5E55),
          borderRadius: BorderRadius.all(Radius.circular(18)),
        ),
        child: Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _AssistantBubble extends StatelessWidget {
  final String text;
  final String? metaText;
  final List<String>? emojiRow;

  const _AssistantBubble({required this.text, this.metaText, this.emojiRow});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF1B1D20),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              text,
              style: TextStyle(
                color: Colors.white.withOpacity(0.85),
                fontWeight: FontWeight.w500,
              ),
            ),
            if (metaText != null) ...<Widget>[
              const SizedBox(height: 10),
              Text(
                metaText!,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ],
            if (emojiRow != null && emojiRow!.isNotEmpty) ...<Widget>[
              const SizedBox(height: 6),
              Row(
                children: <Widget>[
                  for (final e in emojiRow!) ...<Widget>[
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Text(e, style: const TextStyle(fontSize: 16)),
                    ),
                  ],
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  final String title;
  final String subtitle;

  const _StatusCard({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(14),
        width: double.infinity,
        decoration: BoxDecoration(
          color: const Color(0xFF1B1D20),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFF35A29F).withOpacity(0.35)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                const Icon(
                  Icons.check_circle,
                  color: Color(0xFF35A29F),
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: TextStyle(
                color: Colors.white.withOpacity(0.65),
                fontSize: 13,
                height: 1.25,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

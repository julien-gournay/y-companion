import 'package:flutter/material.dart';

import '../models/student_profile.dart';

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
  }) =>
      _ChatMessage._(
        type: _ChatMessageType.assistant,
        text: text,
        metaText: metaText,
        emojiRow: emojiRow,
      );

  factory _ChatMessage.status({
    required String title,
    required String subtitle,
  }) =>
      _ChatMessage._(
        type: _ChatMessageType.status,
        text: title,
        subtitle: subtitle,
      );
}

class ChatScreen extends StatefulWidget {
  final StudentProfile profile;
  final Future<void> Function() onReset;

  const ChatScreen({
    super.key,
    required this.profile,
    required this.onReset,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  late final List<_ChatMessage> _messages;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();

    // Messages initiaux pour ressembler au screenshot.
    _messages = <_ChatMessage>[
      _ChatMessage.user('Absence justifiée ?'),
      _ChatMessage.assistant(
        text: 'Selon le règlement...',
        metaText: '\$3.1',
        emojiRow: <String>['👋', '👍'],
      ),
      _ChatMessage.status(
        title: 'Réponse reçue',
        subtitle: 'La pédagogie a répondu à votre question.',
      ),
    ];
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
    _inputController.clear();
    _scrollToBottom();

    // Simulation d’une réponse locale (pas de backend pour l’instant).
    // TODO(Ollama): replace this local simulation with OllamaClient.chatText(...)
    // once the screen wiring is implemented.
    await Future.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;

    setState(() {
      _messages.add(
        _ChatMessage.assistant(
          text: 'Selon le règlement...',
          metaText: '\$3.1',
          emojiRow: <String>['👋', '👍'],
        ),
      );
    });
    _scrollToBottom();

    await Future.delayed(const Duration(milliseconds: 250));
    if (!mounted) return;
    setState(() {
      _messages.add(
        _ChatMessage.status(
          title: 'Réponse reçue',
          subtitle: 'La pédagogie a répondu à votre question.',
        ),
      );
      _isSending = false;
    });
    _scrollToBottom();
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
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
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
                    PopupMenuButton<int>(
                      color: const Color(0xFF1B1D20),
                      onSelected: (value) async {
                        if (value == 0) {
                          await widget.onReset();
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
              Expanded(
                child: ListView.builder(
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
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
                                  child: CircularProgressIndicator(strokeWidth: 2),
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

  const _AssistantBubble({
    required this.text,
    this.metaText,
    this.emojiRow,
  });

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
                      child: Text(
                        e,
                        style: const TextStyle(fontSize: 16),
                      ),
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


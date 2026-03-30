import 'package:flutter/material.dart';

import '../models/chat_conversation.dart';
import '../storage/chat_store.dart';

class ChatHistoryScreen extends StatefulWidget {
  final void Function(ChatConversation conversation) onOpenConversation;
  final VoidCallback onNewConversation;

  const ChatHistoryScreen({
    super.key,
    required this.onOpenConversation,
    required this.onNewConversation,
  });

  @override
  State<ChatHistoryScreen> createState() => _ChatHistoryScreenState();
}

class _ChatHistoryScreenState extends State<ChatHistoryScreen> {
  final TextEditingController _search = TextEditingController();
  List<ChatConversation> _all = <ChatConversation>[];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    _search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final conversations = await loadConversations();
    if (!mounted) return;
    setState(() {
      _all = conversations;
      _loading = false;
    });
  }

  String _formatDate(int ms) {
    final dt = DateTime.fromMillisecondsSinceEpoch(ms);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(dt.year, dt.month, dt.day);
    final diffDays = today.difference(d).inDays;
    if (diffDays == 0) return "Aujourd'hui";
    if (diffDays == 1) return 'Hier';
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final query = _search.text.trim().toLowerCase();
    final filtered = query.isEmpty
        ? _all
        : _all
            .where(
              (c) =>
                  c.title.toLowerCase().contains(query) ||
                  (c.lastPreview ?? '').toLowerCase().contains(query),
            )
            .toList();

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
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back),
                      color: Colors.white.withOpacity(0.85),
                    ),
                    const SizedBox(width: 4),
                    const Expanded(
                      child: Text(
                        'Historique',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color.fromRGBO(255, 255, 255, 0.92),
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        showModalBottomSheet<void>(
                          context: context,
                          backgroundColor: const Color(0xFF1B1D20),
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
                          ),
                          builder: (context) {
                            return Padding(
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 18),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: <Widget>[
                                  Container(
                                    width: 42,
                                    height: 4,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.18),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  TextField(
                                    controller: _search,
                                    autofocus: true,
                                    style: const TextStyle(color: Colors.white),
                                    decoration: InputDecoration(
                                      hintText: 'Rechercher...',
                                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.55)),
                                      prefixIcon: Icon(Icons.search, color: Colors.white.withOpacity(0.75)),
                                      filled: true,
                                      fillColor: Colors.white.withOpacity(0.06),
                                      border: OutlineInputBorder(
                                        borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderSide: BorderSide(color: const Color(0xFF35A29F).withOpacity(0.55)),
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      onPressed: () {
                                        _search.clear();
                                        Navigator.of(context).pop();
                                      },
                                      child: const Text(
                                        'Effacer',
                                        style: TextStyle(color: Color(0xFF61C7B5)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        );
                      },
                      icon: const Icon(Icons.search),
                      color: Colors.white.withOpacity(0.85),
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
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : filtered.isEmpty
                        ? Center(
                            child: Text(
                              'Aucune conversation pour le moment.',
                              style: TextStyle(color: Colors.white.withOpacity(0.65)),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final c = filtered[index];
                              return _HistoryCard(
                                title: c.title,
                                subtitle: _formatDate(c.updatedAtMs),
                                isActive: false,
                                onTap: () {
                                  widget.onOpenConversation(c);
                                  Navigator.of(context).pop();
                                },
                              );
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          widget.onNewConversation();
          Navigator.of(context).pop();
        },
        backgroundColor: const Color(0xFF2F5E55),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Nouveau'),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool isActive;
  final VoidCallback onTap;

  const _HistoryCard({
    required this.title,
    required this.subtitle,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1B1D20),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isActive
                  ? const Color(0xFF35A29F).withOpacity(0.55)
                  : Colors.white.withOpacity(0.06),
            ),
          ),
          child: Row(
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isActive ? const Color(0xFF35A29F) : Colors.white.withOpacity(0.18),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


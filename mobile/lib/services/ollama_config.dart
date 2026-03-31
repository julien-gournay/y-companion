class OllamaConfig {
  /// URL de l'API Campus Companion.
  ///
  /// Exemple: `http://localhost:8081`
  final String baseUrl;

  const OllamaConfig({required this.baseUrl});

  factory OllamaConfig.fromEnv() {
    // Priorite a CAMPUS_API_BASE_URL, fallback pour compatibilite avec anciennes
    // variables d'environnement.
    const campusBaseUrl = String.fromEnvironment(
      'CAMPUS_API_BASE_URL',
      defaultValue: '',
    );
    const pedagogyBaseUrl = String.fromEnvironment(
      'PEDAGOGY_API_BASE_URL',
      defaultValue: '',
    );
    const ollamaBaseUrl = String.fromEnvironment(
      'OLLAMA_BASE_URL',
      defaultValue: '',
    );
    const baseUrl = campusBaseUrl;
    final selected = baseUrl.trim().isNotEmpty
        ? baseUrl
        : (pedagogyBaseUrl.trim().isNotEmpty ? pedagogyBaseUrl : ollamaBaseUrl);
    return OllamaConfig(
      baseUrl: _normalizeBaseUrl(
        selected.trim().isEmpty ? 'http://localhost:8081' : selected,
      ),
    );
  }

  Uri get chatUri => Uri.parse('$baseUrl/api/chat');

  static String _normalizeBaseUrl(String url) {
    var s = url.trim();
    while (s.endsWith('/')) {
      s = s.substring(0, s.length - 1);
    }
    return s;
  }
}

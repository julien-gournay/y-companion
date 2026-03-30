class PedagogyConfig {
  /// Base URL de l'API Campus Companion.
  ///
  /// Exemple: `http://localhost:8080`
  final String baseUrl;

  /// Jeton optionnel (si l'API nécessite une auth simple côté mobile).
  final String? apiToken;

  const PedagogyConfig({
    required this.baseUrl,
    this.apiToken,
  });

  factory PedagogyConfig.fromEnv() {
    const campusBaseUrl = String.fromEnvironment('CAMPUS_API_BASE_URL', defaultValue: '');
    const pedagogyBaseUrl = String.fromEnvironment('PEDAGOGY_API_BASE_URL', defaultValue: '');
    const baseUrl = campusBaseUrl;
    const token = String.fromEnvironment('PEDAGOGY_API_TOKEN', defaultValue: '');
    return PedagogyConfig(
      baseUrl: _normalizeBaseUrl(
        (baseUrl.trim().isNotEmpty ? baseUrl : pedagogyBaseUrl).trim().isEmpty
            ? 'http://localhost:8080'
            : (baseUrl.trim().isNotEmpty ? baseUrl : pedagogyBaseUrl),
      ),
      apiToken: token.trim().isEmpty ? null : token.trim(),
    );
  }

  bool get isConfigured => baseUrl.trim().isNotEmpty;

  Uri get submitQuestionUri => Uri.parse('$baseUrl/api/tickets/fallback');

  static String _normalizeBaseUrl(String url) {
    var s = url.trim();
    while (s.endsWith('/')) {
      s = s.substring(0, s.length - 1);
    }
    return s;
  }
}


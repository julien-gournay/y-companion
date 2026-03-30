class PedagogyConfig {
  /// Base URL de la future API backoffice.
  ///
  /// Exemple: `https://api.example.com`
  final String baseUrl;

  /// Jeton optionnel (si l'API nécessite une auth simple côté mobile).
  final String? apiToken;

  const PedagogyConfig({
    required this.baseUrl,
    this.apiToken,
  });

  factory PedagogyConfig.fromEnv() {
    // Surcharge au build, par ex:
    // flutter run --dart-define=PEDAGOGY_API_BASE_URL="https://api.example.com" --dart-define=PEDAGOGY_API_TOKEN="..."
    const baseUrl = String.fromEnvironment(
      'PEDAGOGY_API_BASE_URL',
      defaultValue: '',
    );
    const token = String.fromEnvironment('PEDAGOGY_API_TOKEN', defaultValue: '');
    return PedagogyConfig(
      baseUrl: _normalizeBaseUrl(baseUrl),
      apiToken: token.trim().isEmpty ? null : token.trim(),
    );
  }

  bool get isConfigured => baseUrl.trim().isNotEmpty;

  /// Endpoint proposé (à ajuster quand l'API sera figée).
  Uri get submitQuestionUri => Uri.parse('$baseUrl/api/pedagogy/questions');

  static String _normalizeBaseUrl(String url) {
    var s = url.trim();
    while (s.endsWith('/')) {
      s = s.substring(0, s.length - 1);
    }
    return s;
  }
}


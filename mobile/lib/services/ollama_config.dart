class OllamaConfig {
  /// URL de votre instance Ollama.
  ///
  /// Exemple: `http://localhost:11434`
  final String baseUrl;

  /// Nom du modele charge dans Ollama.
  ///
  /// Exemple: `llama3`
  final String model;

  const OllamaConfig({
    required this.baseUrl,
    required this.model,
  });

  factory OllamaConfig.fromEnv() {
    // Ces valeurs peuvent etre surchargees lors du build, par ex:
    // flutter run --dart-define=OLLAMA_BASE_URL="http://192.168.1.10:11434" --dart-define=OLLAMA_MODEL="llama3"
    const baseUrl =
        String.fromEnvironment('OLLAMA_BASE_URL', defaultValue: 'http://localhost:11434');
    const model = String.fromEnvironment('OLLAMA_MODEL', defaultValue: 'llama3');
    return OllamaConfig(
      baseUrl: _normalizeBaseUrl(baseUrl),
      model: model,
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


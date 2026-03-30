class StudentProfile {
  final String nom;
  final String prenom;
  final String classe;
  final String email;

  const StudentProfile({
    required this.nom,
    required this.prenom,
    required this.classe,
    required this.email,
  });

  Map<String, dynamic> toJson() => <String, dynamic>{
        'nom': nom,
        'prenom': prenom,
        'classe': classe,
        'email': email,
      };

  factory StudentProfile.fromJson(Map<String, dynamic> json) {
    return StudentProfile(
      nom: (json['nom'] ?? '').toString(),
      prenom: (json['prenom'] ?? '').toString(),
      classe: (json['classe'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
    );
  }
}


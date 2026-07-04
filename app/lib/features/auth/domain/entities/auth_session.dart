import 'user.dart';

class AuthSession {
  const AuthSession({required this.user, required this.hasCharacter});

  final User user;
  final bool hasCharacter;
}

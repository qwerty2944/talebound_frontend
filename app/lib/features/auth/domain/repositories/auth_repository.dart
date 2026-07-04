import '../entities/auth_session.dart';

abstract interface class AuthRepository {
  Future<AuthSession> signUp({required String email, required String password});
  Future<AuthSession> signIn({required String email, required String password});
  Future<AuthSession> resetPassword({required String email, required String password});

  /// 저장된 토큰으로 세션 복원. 토큰이 없거나 만료면 null.
  Future<AuthSession?> restoreSession();

  Future<void> signOut();
}

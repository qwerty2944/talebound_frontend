import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/repositories/auth_repository_impl.dart';
import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

part 'reset_password.g.dart';

/// 백필 유저(비밀번호 없음) 전용 재설정.
class ResetPassword {
  const ResetPassword(this._repository);

  final AuthRepository _repository;

  Future<AuthSession> call({required String email, required String password}) =>
      _repository.resetPassword(email: email, password: password);
}

@riverpod
ResetPassword resetPassword(Ref ref) =>
    ResetPassword(ref.watch(authRepositoryProvider));

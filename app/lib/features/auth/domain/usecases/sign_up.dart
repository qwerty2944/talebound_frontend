import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/repositories/auth_repository_impl.dart';
import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

part 'sign_up.g.dart';

class SignUp {
  const SignUp(this._repository);

  final AuthRepository _repository;

  Future<AuthSession> call({required String email, required String password}) =>
      _repository.signUp(email: email, password: password);
}

@riverpod
SignUp signUp(Ref ref) => SignUp(ref.watch(authRepositoryProvider));

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/repositories/auth_repository_impl.dart';
import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

part 'sign_in.g.dart';

class SignIn {
  const SignIn(this._repository);

  final AuthRepository _repository;

  Future<AuthSession> call({required String email, required String password}) =>
      _repository.signIn(email: email, password: password);
}

@riverpod
SignIn signIn(Ref ref) => SignIn(ref.watch(authRepositoryProvider));

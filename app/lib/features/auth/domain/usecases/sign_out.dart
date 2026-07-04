import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/repositories/auth_repository_impl.dart';
import '../repositories/auth_repository.dart';

part 'sign_out.g.dart';

class SignOut {
  const SignOut(this._repository);

  final AuthRepository _repository;

  Future<void> call() => _repository.signOut();
}

@riverpod
SignOut signOut(Ref ref) => SignOut(ref.watch(authRepositoryProvider));

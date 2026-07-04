import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/repositories/auth_repository_impl.dart';
import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

part 'restore_session.g.dart';

class RestoreSession {
  const RestoreSession(this._repository);

  final AuthRepository _repository;

  Future<AuthSession?> call() => _repository.restoreSession();
}

@riverpod
RestoreSession restoreSession(Ref ref) =>
    RestoreSession(ref.watch(authRepositoryProvider));

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../domain/entities/auth_session.dart';
import '../../domain/usecases/reset_password.dart';
import '../../domain/usecases/restore_session.dart';
import '../../domain/usecases/sign_in.dart';
import '../../domain/usecases/sign_out.dart';
import '../../domain/usecases/sign_up.dart';

part 'auth_controller.g.dart';

/// 로그인 세션 상태. null이면 비로그인.
@Riverpod(keepAlive: true)
class AuthController extends _$AuthController {
  @override
  Future<AuthSession?> build() => ref.watch(restoreSessionProvider).call();

  Future<void> signIn({required String email, required String password}) =>
      _run(() => ref.read(signInProvider).call(email: email, password: password));

  Future<void> signUp({required String email, required String password}) =>
      _run(() => ref.read(signUpProvider).call(email: email, password: password));

  Future<void> resetPassword({required String email, required String password}) =>
      _run(() =>
          ref.read(resetPasswordProvider).call(email: email, password: password));

  Future<void> signOut() async {
    await ref.read(signOutProvider).call();
    state = const AsyncData(null);
  }

  Future<void> _run(Future<AuthSession> Function() action) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(action);
  }
}

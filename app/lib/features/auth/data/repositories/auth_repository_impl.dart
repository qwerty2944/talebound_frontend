import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_exception.dart';
import '../../../../core/storage/token_storage.dart';
import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_api.dart';
import '../models/auth_request_dto.dart';
import '../models/auth_response_dto.dart';

part 'auth_repository_impl.g.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._api, this._tokenStorage);

  final AuthApi _api;
  final TokenStorage _tokenStorage;

  Future<AuthSession> _authorize(
    Future<AuthResponseDto> Function() request,
  ) async {
    try {
      final res = await request();
      await _tokenStorage.save(res.token);
      return res.toEntity();
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  @override
  Future<AuthSession> signUp({required String email, required String password}) =>
      _authorize(() => _api.signUp(AuthRequestDto(email: email, password: password)));

  @override
  Future<AuthSession> signIn({required String email, required String password}) =>
      _authorize(() => _api.signIn(AuthRequestDto(email: email, password: password)));

  @override
  Future<AuthSession> resetPassword({required String email, required String password}) =>
      _authorize(() => _api.resetPassword(AuthRequestDto(email: email, password: password)));

  @override
  Future<AuthSession?> restoreSession() async {
    final token = _tokenStorage.read();
    if (token == null) return null;
    try {
      final res = await _api.me();
      return res.toEntity();
    } on DioException {
      await _tokenStorage.clear();
      return null;
    }
  }

  @override
  Future<void> signOut() => _tokenStorage.clear();
}

@Riverpod(keepAlive: true)
AuthRepository authRepository(Ref ref) => AuthRepositoryImpl(
      ref.watch(authApiProvider),
      ref.watch(tokenStorageProvider),
    );

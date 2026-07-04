import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'token_storage.g.dart';

class TokenStorage {
  TokenStorage(this._prefs);

  static const _tokenKey = 'auth_token';
  final SharedPreferences _prefs;

  String? read() => _prefs.getString(_tokenKey);
  Future<void> save(String token) => _prefs.setString(_tokenKey, token);
  Future<void> clear() async {
    await _prefs.remove(_tokenKey);
  }
}

@Riverpod(keepAlive: true)
TokenStorage tokenStorage(Ref ref) =>
    TokenStorage(ref.watch(sharedPreferencesProvider));

/// main()에서 실제 인스턴스로 override한다.
@Riverpod(keepAlive: true)
SharedPreferences sharedPreferences(Ref ref) =>
    throw UnimplementedError('main()에서 override 필요');

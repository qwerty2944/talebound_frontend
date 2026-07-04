import 'dart:io';

import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../storage/token_storage.dart';

part 'api_client.g.dart';

/// 백엔드 주소. Android 에뮬레이터는 10.0.2.2로 호스트에 접근한다.
String get _defaultBaseUrl {
  final host = Platform.isAndroid ? '10.0.2.2' : 'localhost';
  return 'http://$host:2567/api';
}

@Riverpod(keepAlive: true)
String baseUrl(Ref ref) =>
    const String.fromEnvironment('API_URL', defaultValue: '') != ''
        ? const String.fromEnvironment('API_URL')
        : _defaultBaseUrl;

@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ref.watch(baseUrlProvider),
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = ref.read(tokenStorageProvider).read();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ),
  );

  return dio;
}

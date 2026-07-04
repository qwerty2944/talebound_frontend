import 'package:dio/dio.dart';

/// 백엔드가 내려주는 `{ error, code? }` 형태의 에러를 도메인 예외로 변환한다.
class ApiException implements Exception {
  const ApiException(this.message, {this.code, this.statusCode});

  final String message;
  final String? code;
  final int? statusCode;

  factory ApiException.fromDioException(DioException e) {
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      return ApiException(
        data['error'] as String? ?? '알 수 없는 오류가 발생했습니다',
        code: data['code'] as String?,
        statusCode: e.response?.statusCode,
      );
    }
    return ApiException(
      '서버에 연결할 수 없습니다',
      statusCode: e.response?.statusCode,
    );
  }

  bool get isPasswordResetRequired => code == 'PASSWORD_RESET_REQUIRED';

  @override
  String toString() => message;
}

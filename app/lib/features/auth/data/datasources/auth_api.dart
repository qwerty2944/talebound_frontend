import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';
import '../models/auth_request_dto.dart';
import '../models/auth_response_dto.dart';

part 'auth_api.g.dart';

@RestApi()
abstract class AuthApi {
  factory AuthApi(Dio dio, {String? baseUrl}) = _AuthApi;

  @POST('/auth/signup')
  Future<AuthResponseDto> signUp(@Body() AuthRequestDto body);

  @POST('/auth/login')
  Future<AuthResponseDto> signIn(@Body() AuthRequestDto body);

  @POST('/auth/reset-password')
  Future<AuthResponseDto> resetPassword(@Body() AuthRequestDto body);

  @GET('/auth/me')
  Future<MeResponseDto> me();
}

@Riverpod(keepAlive: true)
AuthApi authApi(Ref ref) => AuthApi(ref.watch(dioProvider));

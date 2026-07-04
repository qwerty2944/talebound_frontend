import 'package:freezed_annotation/freezed_annotation.dart';

import '../../domain/entities/auth_session.dart';
import '../../domain/entities/user.dart';

part 'auth_response_dto.freezed.dart';
part 'auth_response_dto.g.dart';

@freezed
abstract class UserDto with _$UserDto {
  const factory UserDto({
    required String id,
    required String email,
  }) = _UserDto;

  factory UserDto.fromJson(Map<String, dynamic> json) => _$UserDtoFromJson(json);
}

@freezed
abstract class AuthResponseDto with _$AuthResponseDto {
  const AuthResponseDto._();

  const factory AuthResponseDto({
    required String token,
    required UserDto user,
    required bool hasCharacter,
  }) = _AuthResponseDto;

  factory AuthResponseDto.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseDtoFromJson(json);

  AuthSession toEntity() => AuthSession(
        user: User(id: user.id, email: user.email),
        hasCharacter: hasCharacter,
      );
}

@freezed
abstract class MeResponseDto with _$MeResponseDto {
  const MeResponseDto._();

  const factory MeResponseDto({
    required UserDto user,
    required bool hasCharacter,
  }) = _MeResponseDto;

  factory MeResponseDto.fromJson(Map<String, dynamic> json) =>
      _$MeResponseDtoFromJson(json);

  AuthSession toEntity() => AuthSession(
        user: User(id: user.id, email: user.email),
        hasCharacter: hasCharacter,
      );
}

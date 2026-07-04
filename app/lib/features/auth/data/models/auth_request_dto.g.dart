// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_request_dto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AuthRequestDto _$AuthRequestDtoFromJson(Map<String, dynamic> json) =>
    _AuthRequestDto(
      email: json['email'] as String,
      password: json['password'] as String,
    );

Map<String, dynamic> _$AuthRequestDtoToJson(_AuthRequestDto instance) =>
    <String, dynamic>{'email': instance.email, 'password': instance.password};

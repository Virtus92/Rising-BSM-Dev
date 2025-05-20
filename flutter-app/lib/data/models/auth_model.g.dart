// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AuthTokens _$AuthTokensFromJson(Map<String, dynamic> json) => AuthTokens(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      expiresIn: json['expiresIn'] as int? ?? 900,
    );

Map<String, dynamic> _$AuthTokensToJson(AuthTokens instance) =>
    <String, dynamic>{
      'accessToken': instance.accessToken,
      'refreshToken': instance.refreshToken,
      'expiresIn': instance.expiresIn,
    };

LoginCredentials _$LoginCredentialsFromJson(Map<String, dynamic> json) =>
    LoginCredentials(
      email: json['email'] as String,
      password: json['password'] as String,
      rememberMe: json['rememberMe'] as bool? ?? false,
    );

Map<String, dynamic> _$LoginCredentialsToJson(LoginCredentials instance) =>
    <String, dynamic>{
      'email': instance.email,
      'password': instance.password,
      'rememberMe': instance.rememberMe,
    };

RegisterCredentials _$RegisterCredentialsFromJson(Map<String, dynamic> json) =>
    RegisterCredentials(
      name: json['name'] as String,
      email: json['email'] as String,
      password: json['password'] as String,
      passwordConfirmation: json['passwordConfirmation'] as String,
    );

Map<String, dynamic> _$RegisterCredentialsToJson(
        RegisterCredentials instance) =>
    <String, dynamic>{
      'name': instance.name,
      'email': instance.email,
      'password': instance.password,
      'passwordConfirmation': instance.passwordConfirmation,
    };

LoginResponse _$LoginResponseFromJson(Map<String, dynamic> json) =>
    LoginResponse(
      tokens: AuthTokens.fromJson(json['tokens'] as Map<String, dynamic>),
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$LoginResponseToJson(LoginResponse instance) =>
    <String, dynamic>{
      'tokens': instance.tokens,
      'user': instance.user,
    };

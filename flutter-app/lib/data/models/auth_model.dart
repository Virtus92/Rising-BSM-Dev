import 'package:json_annotation/json_annotation.dart';

import 'user_model.dart';

part 'auth_model.g.dart';

@JsonSerializable()
class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;

  AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    this.expiresIn = 900, // Default 15 minutes
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) =>
      _$AuthTokensFromJson(json);

  Map<String, dynamic> toJson() => _$AuthTokensToJson(this);
}

@JsonSerializable()
class LoginCredentials {
  final String email;
  final String password;
  final bool rememberMe;

  LoginCredentials({
    required this.email,
    required this.password,
    this.rememberMe = false,
  });

  factory LoginCredentials.fromJson(Map<String, dynamic> json) =>
      _$LoginCredentialsFromJson(json);

  Map<String, dynamic> toJson() => _$LoginCredentialsToJson(this);
}

@JsonSerializable()
class RegisterCredentials {
  final String name;
  final String email;
  final String password;
  final String passwordConfirmation;

  RegisterCredentials({
    required this.name,
    required this.email,
    required this.password,
    required this.passwordConfirmation,
  });

  factory RegisterCredentials.fromJson(Map<String, dynamic> json) =>
      _$RegisterCredentialsFromJson(json);

  Map<String, dynamic> toJson() => _$RegisterCredentialsToJson(this);
}

@JsonSerializable()
class LoginResponse {
  final AuthTokens tokens;
  final UserModel user;

  LoginResponse({
    required this.tokens,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) =>
      _$LoginResponseFromJson(json);

  Map<String, dynamic> toJson() => _$LoginResponseToJson(this);
}

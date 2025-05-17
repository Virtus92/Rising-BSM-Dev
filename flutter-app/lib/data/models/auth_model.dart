// Auth models for authentication and authorization
import 'package:json_annotation/json_annotation.dart';

import 'user_model.dart';

part 'auth_model.g.dart';

/// Credentials model for login
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

/// Registration model for new user registration
@JsonSerializable()
class RegisterRequest {
  final String name;
  final String email;
  final String password;
  final String passwordConfirmation;

  RegisterRequest({
    required this.name,
    required this.email,
    required this.password,
    required this.passwordConfirmation,
  });

  factory RegisterRequest.fromJson(Map<String, dynamic> json) => 
      _$RegisterRequestFromJson(json);

  Map<String, dynamic> toJson() => _$RegisterRequestToJson(this);
}

/// Auth tokens received from the server
@JsonSerializable()
class AuthTokens {
  final String accessToken;
  final String refreshToken;
  
  @JsonKey(name: 'expiresIn')
  final int expiresIn;
  
  @JsonKey(name: 'tokenType')
  final String tokenType;

  AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
    this.tokenType = 'Bearer',
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) => 
      _$AuthTokensFromJson(json);

  Map<String, dynamic> toJson() => _$AuthTokensToJson(this);
  
  // Calculate token expiry date
  DateTime get expiryDate => 
      DateTime.now().add(Duration(seconds: expiresIn));
      
  // Check if token is expired or about to expire
  bool get isExpiringSoon => 
      expiryDate.difference(DateTime.now()).inMinutes <= 5;
  
  // Format for Authorization header
  String get authorizationHeader => 
      '$tokenType $accessToken';
}

/// Auth response with tokens and user data
@JsonSerializable()
class AuthResponse {
  final AuthTokens tokens;
  final UserModel user;

  AuthResponse({
    required this.tokens,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => 
      _$AuthResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}

/// Password change request
@JsonSerializable()
class ChangePasswordRequest {
  final String currentPassword;
  final String newPassword;
  final String passwordConfirmation;

  ChangePasswordRequest({
    required this.currentPassword,
    required this.newPassword,
    required this.passwordConfirmation,
  });

  factory ChangePasswordRequest.fromJson(Map<String, dynamic> json) => 
      _$ChangePasswordRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ChangePasswordRequestToJson(this);
}

/// Password reset request
@JsonSerializable()
class ForgotPasswordRequest {
  final String email;

  ForgotPasswordRequest({
    required this.email,
  });

  factory ForgotPasswordRequest.fromJson(Map<String, dynamic> json) => 
      _$ForgotPasswordRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ForgotPasswordRequestToJson(this);
}

/// Reset password with token request
@JsonSerializable()
class ResetPasswordRequest {
  final String token;
  final String password;
  final String passwordConfirmation;

  ResetPasswordRequest({
    required this.token,
    required this.password,
    required this.passwordConfirmation,
  });

  factory ResetPasswordRequest.fromJson(Map<String, dynamic> json) => 
      _$ResetPasswordRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ResetPasswordRequestToJson(this);
}

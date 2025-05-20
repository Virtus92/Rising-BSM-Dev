import 'package:json_annotation/json_annotation.dart';

part 'auth_request_models.g.dart';

/// Request model for user registration
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

/// Request model for password change
@JsonSerializable()
class ChangePasswordRequest {
  final String currentPassword;
  final String newPassword;
  final String newPasswordConfirmation;

  ChangePasswordRequest({
    required this.currentPassword,
    required this.newPassword,
    required this.newPasswordConfirmation,
  });

  factory ChangePasswordRequest.fromJson(Map<String, dynamic> json) => 
      _$ChangePasswordRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ChangePasswordRequestToJson(this);
}

/// Request model for password reset
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

/// Request model for forgot password
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

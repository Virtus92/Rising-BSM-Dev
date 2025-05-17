// User model representing a user in the system
import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  final int id;
  final String name;
  final String email;
  final String role;
  final String status;
  final String? phone;
  
  @JsonKey(name: 'profilePictureId')
  final int? profilePictureId;
  
  @JsonKey(name: 'profilePicture')
  final String? profilePicture;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;
  
  @JsonKey(name: 'lastLoginAt')
  final DateTime? lastLoginAt;
  
  @JsonKey(name: 'settings')
  final UserSettingsModel? settings;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.status,
    this.phone,
    this.profilePictureId,
    this.profilePicture,
    required this.createdAt,
    required this.updatedAt,
    this.lastLoginAt,
    this.settings,
  });

  // Getters for role types
  bool get isAdmin => role == 'admin';
  bool get isManager => role == 'manager';
  bool get isEmployee => role == 'employee';
  bool get isUser => role == 'user';

  // Getters for status types
  bool get isActive => status == 'active';
  bool get isInactive => status == 'inactive';
  bool get isPending => status == 'pending';
  bool get isBlocked => status == 'blocked';

  factory UserModel.fromJson(Map<String, dynamic> json) => 
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);
}

@JsonSerializable()
class UserSettingsModel {
  final bool darkMode;
  final String language;
  final NotificationSettingsModel notifications;

  const UserSettingsModel({
    this.darkMode = false,
    this.language = 'en',
    required this.notifications,
  });

  factory UserSettingsModel.fromJson(Map<String, dynamic> json) => 
      _$UserSettingsModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserSettingsModelToJson(this);
}

@JsonSerializable()
class NotificationSettingsModel {
  final bool email;
  final bool push;
  final bool sms;

  const NotificationSettingsModel({
    this.email = true,
    this.push = true,
    this.sms = false,
  });

  factory NotificationSettingsModel.fromJson(Map<String, dynamic> json) => 
      _$NotificationSettingsModelFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationSettingsModelToJson(this);
}

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserModel _$UserModelFromJson(Map<String, dynamic> json) => UserModel(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      status: json['status'] as String,
      phone: json['phone'] as String?,
      profilePictureId: json['profilePictureId'] as int?,
      profilePicture: json['profilePicture'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
      lastLoginAt: json['lastLoginAt'] == null
          ? null
          : DateTime.parse(json['lastLoginAt'] as String),
      settings: json['settings'] == null
          ? null
          : UserSettingsModel.fromJson(json['settings'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$UserModelToJson(UserModel instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'role': instance.role,
      'status': instance.status,
      'phone': instance.phone,
      'profilePictureId': instance.profilePictureId,
      'profilePicture': instance.profilePicture,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'lastLoginAt': instance.lastLoginAt?.toIso8601String(),
      'settings': instance.settings,
    };

UserSettingsModel _$UserSettingsModelFromJson(Map<String, dynamic> json) =>
    UserSettingsModel(
      darkMode: json['darkMode'] as bool? ?? false,
      language: json['language'] as String? ?? 'en',
      notifications: NotificationSettingsModel.fromJson(
          json['notifications'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$UserSettingsModelToJson(UserSettingsModel instance) =>
    <String, dynamic>{
      'darkMode': instance.darkMode,
      'language': instance.language,
      'notifications': instance.notifications,
    };

NotificationSettingsModel _$NotificationSettingsModelFromJson(
        Map<String, dynamic> json) =>
    NotificationSettingsModel(
      email: json['email'] as bool? ?? true,
      push: json['push'] as bool? ?? true,
      sms: json['sms'] as bool? ?? false,
    );

Map<String, dynamic> _$NotificationSettingsModelToJson(
        NotificationSettingsModel instance) =>
    <String, dynamic>{
      'email': instance.email,
      'push': instance.push,
      'sms': instance.sms,
    };

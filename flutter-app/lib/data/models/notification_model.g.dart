// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationModel _$NotificationModelFromJson(Map<String, dynamic> json) =>
    NotificationModel(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num?)?.toInt(),
      referenceId: (json['referenceId'] as num?)?.toInt(),
      referenceType: json['referenceType'] as String?,
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String?,
      description: json['description'] as String?,
      read: json['read'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$NotificationModelToJson(NotificationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'referenceId': instance.referenceId,
      'referenceType': instance.referenceType,
      'type': instance.type,
      'title': instance.title,
      'message': instance.message,
      'description': instance.description,
      'read': instance.read,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

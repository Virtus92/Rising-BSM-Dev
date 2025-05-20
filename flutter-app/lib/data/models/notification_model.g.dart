// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationModel _$NotificationModelFromJson(Map<String, dynamic> json) =>
    NotificationModel(
      id: json['id'] as int,
      title: json['title'] as String,
      message: json['message'] as String,
      type: json['type'] as String,
      isRead: json['isRead'] as bool,
      userId: json['userId'] as int,
      entityId: json['entityId'] as int?,
      entityType: json['entityType'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      readAt: json['readAt'] == null
          ? null
          : DateTime.parse(json['readAt'] as String),
      data: json['data'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$NotificationModelToJson(NotificationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'message': instance.message,
      'type': instance.type,
      'isRead': instance.isRead,
      'userId': instance.userId,
      'entityId': instance.entityId,
      'entityType': instance.entityType,
      'createdAt': instance.createdAt.toIso8601String(),
      'readAt': instance.readAt?.toIso8601String(),
      'data': instance.data,
    };

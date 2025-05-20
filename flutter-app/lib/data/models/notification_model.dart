import 'package:json_annotation/json_annotation.dart';
import 'package:flutter/material.dart';

part 'notification_model.g.dart';

@JsonSerializable()
class NotificationModel {
  final int id;
  final String title;
  final String message;
  final String type;
  
  @JsonKey(name: 'isRead')
  final bool isRead;
  
  @JsonKey(name: 'userId')
  final int userId;
  
  @JsonKey(name: 'entityId')
  final int? entityId;
  
  @JsonKey(name: 'entityType')
  final String? entityType;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'readAt')
  final DateTime? readAt;
  
  final Map<String, dynamic>? data;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.userId,
    this.entityId,
    this.entityType,
    required this.createdAt,
    this.readAt,
    this.data,
  });

  // Create a copy with updated fields
  NotificationModel copyWith({
    int? id,
    String? title,
    String? message,
    String? type,
    bool? isRead,
    int? userId,
    int? entityId,
    String? entityType,
    DateTime? createdAt,
    DateTime? readAt,
    Map<String, dynamic>? data,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      isRead: isRead ?? this.isRead,
      userId: userId ?? this.userId,
      entityId: entityId ?? this.entityId,
      entityType: entityType ?? this.entityType,
      createdAt: createdAt ?? this.createdAt,
      readAt: readAt ?? this.readAt,
      data: data ?? this.data,
    );
  }

  factory NotificationModel.fromJson(Map<String, dynamic> json) => 
      _$NotificationModelFromJson(json);
      
  Map<String, dynamic> toJson() => _$NotificationModelToJson(this);
  
  // Get icon based on notification type
  IconData getIcon() {
    switch (type) {
      case 'request':
        return Icons.question_answer;
      case 'appointment':
        return Icons.calendar_today;
      case 'customer':
        return Icons.people;
      case 'user':
        return Icons.person;
      case 'system':
        return Icons.notifications_active;
      default:
        return Icons.notifications;
    }
  }
}

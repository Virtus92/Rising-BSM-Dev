// Notification model representing a system or user notification
import 'package:json_annotation/json_annotation.dart';

part 'notification_model.g.dart';

@JsonSerializable()
class NotificationModel {
  final int id;
  
  @JsonKey(name: 'userId')
  final int? userId;
  
  @JsonKey(name: 'referenceId')
  final int? referenceId;
  
  @JsonKey(name: 'referenceType')
  final String? referenceType;
  
  final String type;
  final String title;
  final String? message;
  final String? description;
  final bool read;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;

  const NotificationModel({
    required this.id,
    this.userId,
    this.referenceId,
    this.referenceType,
    required this.type,
    required this.title,
    this.message,
    this.description,
    required this.read,
    required this.createdAt,
    required this.updatedAt,
  });

  // Check if notification is related to a specific entity
  bool get hasReference => referenceId != null && referenceType != null;
  
  // Helper to get appropriate icon based on notification type
  String getIconAsset() {
    switch (type) {
      case 'appointment':
        return 'assets/icons/calendar.svg';
      case 'request':
        return 'assets/icons/request.svg';
      case 'customer':
        return 'assets/icons/customer.svg';
      case 'user':
        return 'assets/icons/user.svg';
      case 'system':
        return 'assets/icons/system.svg';
      case 'alert':
        return 'assets/icons/alert.svg';
      default:
        return 'assets/icons/notification.svg';
    }
  }

  factory NotificationModel.fromJson(Map<String, dynamic> json) => 
      _$NotificationModelFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationModelToJson(this);
}

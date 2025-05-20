import 'package:json_annotation/json_annotation.dart';

import 'customer_model.dart';
import 'user_model.dart';

part 'request_model.g.dart';

@JsonSerializable()
class RequestModel {
  final int id;
  final String title;
  final String description;
  final String status;
  final String priority;
  
  @JsonKey(name: 'customerId')
  final int? customerId;
  
  @JsonKey(name: 'assignedTo')
  final int? assignedTo;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;
  
  @JsonKey(name: 'createdBy')
  final int? createdBy;
  
  @JsonKey(name: 'updatedBy')
  final int? updatedBy;
  
  final CustomerModel? customer;
  final UserModel? assignedToUser;
  final List<RequestNoteModel>? notes;
  final RequestDataModel? data;

  const RequestModel({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.priority,
    this.customerId,
    this.assignedTo,
    required this.createdAt,
    required this.updatedAt,
    this.createdBy,
    this.updatedBy,
    this.customer,
    this.assignedToUser,
    this.notes,
    this.data,
  });

  // Getters for status types
  bool get isNew => status == 'new';
  bool get isInProgress => status == 'in_progress';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isWaiting => status == 'waiting';

  // Getters for priority types
  bool get isLow => priority == 'low';
  bool get isMedium => priority == 'medium';
  bool get isHigh => priority == 'high';
  bool get isUrgent => priority == 'urgent';

  // Check if the request is assigned
  bool get isAssigned => assignedTo != null;

  // Check if the request has a customer
  bool get hasCustomer => customerId != null;

  factory RequestModel.fromJson(Map<String, dynamic> json) => 
      _$RequestModelFromJson(json);

  Map<String, dynamic> toJson() => _$RequestModelToJson(this);
}

@JsonSerializable()
class RequestNoteModel {
  final int id;
  final int requestId;
  final String note;
  final int createdBy;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;
  
  final UserModel? user;

  const RequestNoteModel({
    required this.id,
    required this.requestId,
    required this.note,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.user,
  });

  factory RequestNoteModel.fromJson(Map<String, dynamic> json) => 
      _$RequestNoteModelFromJson(json);

  Map<String, dynamic> toJson() => _$RequestNoteModelToJson(this);
}

@JsonSerializable()
class RequestDataModel {
  final int id;
  final int requestId;
  final Map<String, dynamic> data;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;

  const RequestDataModel({
    required this.id,
    required this.requestId,
    required this.data,
    required this.createdAt,
    required this.updatedAt,
  });

  factory RequestDataModel.fromJson(Map<String, dynamic> json) => 
      _$RequestDataModelFromJson(json);

  Map<String, dynamic> toJson() => _$RequestDataModelToJson(this);
}

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RequestModel _$RequestModelFromJson(Map<String, dynamic> json) => RequestModel(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String,
      status: json['status'] as String,
      priority: json['priority'] as String,
      customerId: json['customerId'] as int?,
      assignedTo: json['assignedTo'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      createdBy: json['createdBy'] as int?,
      updatedBy: json['updatedBy'] as int?,
      customer: json['customer'] == null
          ? null
          : CustomerModel.fromJson(json['customer'] as Map<String, dynamic>),
      assignedToUser: json['assignedToUser'] == null
          ? null
          : UserModel.fromJson(json['assignedToUser'] as Map<String, dynamic>),
      notes: (json['notes'] as List<dynamic>?)
          ?.map((e) => RequestNoteModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      data: json['data'] == null
          ? null
          : RequestDataModel.fromJson(json['data'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$RequestModelToJson(RequestModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'status': instance.status,
      'priority': instance.priority,
      'customerId': instance.customerId,
      'assignedTo': instance.assignedTo,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'createdBy': instance.createdBy,
      'updatedBy': instance.updatedBy,
      'customer': instance.customer,
      'assignedToUser': instance.assignedToUser,
      'notes': instance.notes,
      'data': instance.data,
    };

RequestNoteModel _$RequestNoteModelFromJson(Map<String, dynamic> json) =>
    RequestNoteModel(
      id: json['id'] as int,
      requestId: json['requestId'] as int,
      note: json['note'] as String,
      createdBy: json['createdBy'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      user: json['user'] == null
          ? null
          : UserModel.fromJson(json['user'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$RequestNoteModelToJson(RequestNoteModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'requestId': instance.requestId,
      'note': instance.note,
      'createdBy': instance.createdBy,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'user': instance.user,
    };

RequestDataModel _$RequestDataModelFromJson(Map<String, dynamic> json) =>
    RequestDataModel(
      id: json['id'] as int,
      requestId: json['requestId'] as int,
      data: json['data'] as Map<String, dynamic>,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$RequestDataModelToJson(RequestDataModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'requestId': instance.requestId,
      'data': instance.data,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

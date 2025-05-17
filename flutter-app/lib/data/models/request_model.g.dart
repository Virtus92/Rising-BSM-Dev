// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RequestModel _$RequestModelFromJson(Map<String, dynamic> json) => RequestModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      service: json['service'] as String,
      message: json['message'] as String,
      status: json['status'] as String,
      processorId: (json['processorId'] as num?)?.toInt(),
      customerId: (json['customerId'] as num?)?.toInt(),
      appointmentId: (json['appointmentId'] as num?)?.toInt(),
      source: json['source'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      notes: (json['notes'] as List<dynamic>?)
          ?.map((e) => RequestNoteModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      requestData: (json['requestData'] as List<dynamic>?)
          ?.map((e) => RequestDataModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$RequestModelToJson(RequestModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'phone': instance.phone,
      'service': instance.service,
      'message': instance.message,
      'status': instance.status,
      'processorId': instance.processorId,
      'customerId': instance.customerId,
      'appointmentId': instance.appointmentId,
      'source': instance.source,
      'metadata': instance.metadata,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'notes': instance.notes,
      'requestData': instance.requestData,
    };

RequestNoteModel _$RequestNoteModelFromJson(Map<String, dynamic> json) =>
    RequestNoteModel(
      id: (json['id'] as num).toInt(),
      requestId: (json['requestId'] as num).toInt(),
      note: json['note'] as String,
      createdBy: (json['createdBy'] as num).toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$RequestNoteModelToJson(RequestNoteModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'requestId': instance.requestId,
      'note': instance.note,
      'createdBy': instance.createdBy,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

RequestDataModel _$RequestDataModelFromJson(Map<String, dynamic> json) =>
    RequestDataModel(
      id: (json['id'] as num).toInt(),
      requestId: (json['requestId'] as num).toInt(),
      key: json['key'] as String,
      value: json['value'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$RequestDataModelToJson(RequestDataModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'requestId': instance.requestId,
      'key': instance.key,
      'value': instance.value,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'appointment_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppointmentModel _$AppointmentModelFromJson(Map<String, dynamic> json) =>
    AppointmentModel(
      id: json['id'] as int,
      title: json['title'] as String,
      customerId: json['customerId'] as int?,
      appointmentDate: DateTime.parse(json['appointmentDate'] as String),
      duration: json['duration'] as int?,
      location: json['location'] as String?,
      description: json['description'] as String?,
      status: json['status'] as String,
      createdBy: json['createdBy'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      customer: json['customer'] == null
          ? null
          : CustomerModel.fromJson(json['customer'] as Map<String, dynamic>),
      notes: (json['notes'] as List<dynamic>?)
          ?.map((e) => AppointmentNoteModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdByUser: json['createdByUser'] == null
          ? null
          : UserModel.fromJson(json['createdByUser'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$AppointmentModelToJson(AppointmentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'customerId': instance.customerId,
      'appointmentDate': instance.appointmentDate.toIso8601String(),
      'duration': instance.duration,
      'location': instance.location,
      'description': instance.description,
      'status': instance.status,
      'createdBy': instance.createdBy,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'customer': instance.customer,
      'notes': instance.notes,
      'createdByUser': instance.createdByUser,
    };

AppointmentNoteModel _$AppointmentNoteModelFromJson(
        Map<String, dynamic> json) =>
    AppointmentNoteModel(
      id: json['id'] as int,
      appointmentId: json['appointmentId'] as int,
      note: json['note'] as String,
      createdBy: json['createdBy'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      user: json['user'] == null
          ? null
          : UserModel.fromJson(json['user'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$AppointmentNoteModelToJson(
        AppointmentNoteModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'appointmentId': instance.appointmentId,
      'note': instance.note,
      'createdBy': instance.createdBy,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'user': instance.user,
    };

// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'customer_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CustomerModel _$CustomerModelFromJson(Map<String, dynamic> json) =>
    CustomerModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      company: json['company'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      postalCode: json['postalCode'] as String?,
      city: json['city'] as String?,
      country: json['country'] as String,
      vatNumber: json['vatNumber'] as String?,
      notes: json['notes'] as String?,
      newsletter: json['newsletter'] as bool,
      status: json['status'] as String,
      type: json['type'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      createdBy: (json['createdBy'] as num?)?.toInt(),
      updatedBy: (json['updatedBy'] as num?)?.toInt(),
    );

Map<String, dynamic> _$CustomerModelToJson(CustomerModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'company': instance.company,
      'email': instance.email,
      'phone': instance.phone,
      'address': instance.address,
      'postalCode': instance.postalCode,
      'city': instance.city,
      'country': instance.country,
      'vatNumber': instance.vatNumber,
      'notes': instance.notes,
      'newsletter': instance.newsletter,
      'status': instance.status,
      'type': instance.type,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'createdBy': instance.createdBy,
      'updatedBy': instance.updatedBy,
    };

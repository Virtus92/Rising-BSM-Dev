// ContactRequest model representing a service request in the system
import 'package:json_annotation/json_annotation.dart';

part 'request_model.g.dart';

@JsonSerializable()
class RequestModel {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String service;
  final String message;
  final String status;
  
  @JsonKey(name: 'processorId')
  final int? processorId;
  
  @JsonKey(name: 'customerId')
  final int? customerId;
  
  @JsonKey(name: 'appointmentId')
  final int? appointmentId;
  
  final String? source;
  final Map<String, dynamic>? metadata;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;
  
  @JsonKey(name: 'notes')
  final List<RequestNoteModel>? notes;
  
  @JsonKey(name: 'requestData')
  final List<RequestDataModel>? requestData;

  const RequestModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.service,
    required this.message,
    required this.status,
    this.processorId,
    this.customerId,
    this.appointmentId,
    this.source,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
    this.notes,
    this.requestData,
  });

  // Getters for status types
  bool get isNew => status == 'new';
  bool get isProcessing => status == 'processing';
  bool get isCompleted => status == 'completed';
  bool get isRejected => status == 'rejected';

  // Check if the request has been assigned to a processor
  bool get isAssigned => processorId != null;

  // Check if the request has been converted to a customer
  bool get isConvertedToCustomer => customerId != null;

  // Check if the request has an appointment created
  bool get hasAppointment => appointmentId != null;

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

  const RequestNoteModel({
    required this.id,
    required this.requestId,
    required this.note,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory RequestNoteModel.fromJson(Map<String, dynamic> json) => 
      _$RequestNoteModelFromJson(json);

  Map<String, dynamic> toJson() => _$RequestNoteModelToJson(this);
}

@JsonSerializable()
class RequestDataModel {
  final int id;
  final int requestId;
  final String key;
  final String value;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;

  const RequestDataModel({
    required this.id,
    required this.requestId,
    required this.key,
    required this.value,
    required this.createdAt,
    required this.updatedAt,
  });

  factory RequestDataModel.fromJson(Map<String, dynamic> json) => 
      _$RequestDataModelFromJson(json);

  Map<String, dynamic> toJson() => _$RequestDataModelToJson(this);
}

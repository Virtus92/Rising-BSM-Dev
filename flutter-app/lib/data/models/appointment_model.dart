// Appointment model representing an appointment in the system
import 'package:json_annotation/json_annotation.dart';

import 'customer_model.dart';
import 'user_model.dart';

part 'appointment_model.g.dart';

@JsonSerializable()
class AppointmentModel {
  final int id;
  final String title;
  
  @JsonKey(name: 'customerId')
  final int? customerId;
  
  @JsonKey(name: 'appointmentDate')
  final DateTime appointmentDate;
  
  final int? duration;
  final String? location;
  final String? description;
  final String status;
  
  @JsonKey(name: 'createdBy')
  final int? createdBy;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;
  
  final CustomerModel? customer;
  final List<AppointmentNoteModel>? notes;
  final UserModel? createdByUser;

  const AppointmentModel({
    required this.id,
    required this.title,
    this.customerId,
    required this.appointmentDate,
    this.duration,
    this.location,
    this.description,
    required this.status,
    this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.customer,
    this.notes,
    this.createdByUser,
  });

  // Getters for status types
  bool get isPlanned => status == 'planned';
  bool get isConfirmed => status == 'confirmed';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';

  // Check if the appointment has a customer assigned
  bool get hasCustomer => customerId != null;

  // Calculate end time of the appointment
  DateTime get endTime {
    if (duration == null || duration == 0) {
      return appointmentDate.add(const Duration(hours: 1)); // Default 1 hour
    }
    return appointmentDate.add(Duration(minutes: duration!));
  }

  // Check if the appointment is in the past
  bool get isPast => appointmentDate.isBefore(DateTime.now());

  // Check if the appointment is today
  bool get isToday {
    final now = DateTime.now();
    return appointmentDate.year == now.year && 
           appointmentDate.month == now.month && 
           appointmentDate.day == now.day;
  }

  factory AppointmentModel.fromJson(Map<String, dynamic> json) => 
      _$AppointmentModelFromJson(json);

  Map<String, dynamic> toJson() => _$AppointmentModelToJson(this);
}

@JsonSerializable()
class AppointmentNoteModel {
  final int id;
  final int appointmentId;
  final String note;
  final int createdBy;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;
  
  final UserModel? user;

  const AppointmentNoteModel({
    required this.id,
    required this.appointmentId,
    required this.note,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.user,
  });

  factory AppointmentNoteModel.fromJson(Map<String, dynamic> json) => 
      _$AppointmentNoteModelFromJson(json);

  Map<String, dynamic> toJson() => _$AppointmentNoteModelToJson(this);
}

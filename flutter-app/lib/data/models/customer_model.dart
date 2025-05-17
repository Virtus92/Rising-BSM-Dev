// Customer model representing a customer in the system
import 'package:json_annotation/json_annotation.dart';

part 'customer_model.g.dart';

@JsonSerializable()
class CustomerModel {
  final int id;
  final String name;
  final String? company;
  final String? email;
  final String? phone;
  final String? address;
  final String? postalCode;
  final String? city;
  final String country;
  final String? vatNumber;
  final String? notes;
  final bool newsletter;
  final String status;
  final String type;
  
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;
  
  @JsonKey(name: 'createdBy')
  final int? createdBy;
  
  @JsonKey(name: 'updatedBy')
  final int? updatedBy;

  const CustomerModel({
    required this.id,
    required this.name,
    this.company,
    this.email,
    this.phone,
    this.address,
    this.postalCode,
    this.city,
    required this.country,
    this.vatNumber,
    this.notes,
    required this.newsletter,
    required this.status,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.createdBy,
    this.updatedBy,
  });

  // Getters for status types
  bool get isActive => status == 'active';
  bool get isInactive => status == 'inactive';

  // Getters for customer types
  bool get isPrivate => type == 'private';
  bool get isBusiness => type == 'business';

  // Get full address
  String getFullAddress() {
    final List<String> parts = [];
    
    if (address != null && address!.isNotEmpty) {
      parts.add(address!);
    }
    
    if (postalCode != null && postalCode!.isNotEmpty) {
      parts.add(postalCode!);
    }
    
    if (city != null && city!.isNotEmpty) {
      parts.add(city!);
    }
    
    parts.add(country);
    
    return parts.join(', ');
  }

  factory CustomerModel.fromJson(Map<String, dynamic> json) => 
      _$CustomerModelFromJson(json);

  Map<String, dynamic> toJson() => _$CustomerModelToJson(this);
}

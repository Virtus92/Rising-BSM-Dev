import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/errors/api_exception.dart';
import '../../../data/models/customer_model.dart';
import '../../../domain/usecases/customers/create_customer_usecase.dart';
import '../../../domain/usecases/customers/delete_customer_usecase.dart';
import '../../../domain/usecases/customers/get_customer_usecase.dart';
import '../../../domain/usecases/customers/get_customers_usecase.dart';
import '../../../domain/usecases/customers/update_customer_usecase.dart';

// Customer Events
abstract class CustomerEvent extends Equatable {
  const CustomerEvent();

  @override
  List<Object?> get props => [];
}

class LoadCustomers extends CustomerEvent {
  final Map<String, dynamic>? filters;

  const LoadCustomers({this.filters});

  @override
  List<Object?> get props => [filters];
}

class LoadCustomer extends CustomerEvent {
  final int id;

  const LoadCustomer(this.id);

  @override
  List<Object?> get props => [id];
}

class CreateCustomer extends CustomerEvent {
  final Map<String, dynamic> data;

  const CreateCustomer(this.data);

  @override
  List<Object?> get props => [data];
}

class UpdateCustomer extends CustomerEvent {
  final int id;
  final Map<String, dynamic> data;

  const UpdateCustomer({
    required this.id,
    required this.data,
  });

  @override
  List<Object?> get props => [id, data];
}

class DeleteCustomer extends CustomerEvent {
  final int id;

  const DeleteCustomer(this.id);

  @override
  List<Object?> get props => [id];
}

// Customer States
abstract class CustomerState extends Equatable {
  const CustomerState();

  @override
  List<Object?> get props => [];
}

class CustomerInitial extends CustomerState {}

class CustomerLoading extends CustomerState {}

class CustomersLoaded extends CustomerState {
  final List<CustomerModel> customers;
  final Map<String, dynamic>? filters;
  final int? total;
  final int? page;
  final int? pageSize;

  const CustomersLoaded({
    required this.customers,
    this.filters,
    this.total,
    this.page,
    this.pageSize,
  });

  @override
  List<Object?> get props => [customers, filters, total, page, pageSize];
}

class CustomerDetailLoaded extends CustomerState {
  final CustomerModel customer;

  const CustomerDetailLoaded(this.customer);

  @override
  List<Object?> get props => [customer];
}

class CustomerCreated extends CustomerState {
  final CustomerModel customer;

  const CustomerCreated(this.customer);

  @override
  List<Object?> get props => [customer];
}

class CustomerUpdated extends CustomerState {
  final CustomerModel customer;

  const CustomerUpdated(this.customer);

  @override
  List<Object?> get props => [customer];
}

class CustomerDeleted extends CustomerState {
  final int id;

  const CustomerDeleted(this.id);

  @override
  List<Object?> get props => [id];
}

class CustomerError extends CustomerState {
  final String message;
  final String? code;

  const CustomerError({
    required this.message,
    this.code,
  });

  @override
  List<Object?> get props => [message, code];
}

class CustomerBloc extends Bloc<CustomerEvent, CustomerState> {
  final GetCustomersUseCase _getCustomersUseCase;
  final GetCustomerUseCase _getCustomerUseCase;
  final CreateCustomerUseCase _createCustomerUseCase;
  final UpdateCustomerUseCase _updateCustomerUseCase;
  final DeleteCustomerUseCase _deleteCustomerUseCase;

  CustomerBloc(
    this._getCustomersUseCase,
    this._getCustomerUseCase,
    this._createCustomerUseCase,
    this._updateCustomerUseCase,
    this._deleteCustomerUseCase,
  ) : super(CustomerInitial()) {
    on<LoadCustomers>(_onLoadCustomers);
    on<LoadCustomer>(_onLoadCustomer);
    on<CreateCustomer>(_onCreateCustomer);
    on<UpdateCustomer>(_onUpdateCustomer);
    on<DeleteCustomer>(_onDeleteCustomer);
  }

  Future<void> _onLoadCustomers(
    LoadCustomers event,
    Emitter<CustomerState> emit,
  ) async {
    emit(CustomerLoading());

    try {
      final result = await _getCustomersUseCase.execute(
        filters: event.filters,
      );

      emit(CustomersLoaded(
        customers: result.data,
        filters: event.filters,
        total: result.meta?.total,
        page: result.meta?.page,
        pageSize: result.meta?.pageSize,
      ));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onLoadCustomer(
    LoadCustomer event,
    Emitter<CustomerState> emit,
  ) async {
    emit(CustomerLoading());

    try {
      final customer = await _getCustomerUseCase.execute(event.id);
      emit(CustomerDetailLoaded(customer));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onCreateCustomer(
    CreateCustomer event,
    Emitter<CustomerState> emit,
  ) async {
    emit(CustomerLoading());

    try {
      final customer = await _createCustomerUseCase.execute(event.data);
      emit(CustomerCreated(customer));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onUpdateCustomer(
    UpdateCustomer event,
    Emitter<CustomerState> emit,
  ) async {
    emit(CustomerLoading());

    try {
      final customer = await _updateCustomerUseCase.execute(
        event.id,
        event.data,
      );
      emit(CustomerUpdated(customer));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onDeleteCustomer(
    DeleteCustomer event,
    Emitter<CustomerState> emit,
  ) async {
    emit(CustomerLoading());

    try {
      await _deleteCustomerUseCase.execute(event.id);
      emit(CustomerDeleted(event.id));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  void _handleError(Object e, Emitter<CustomerState> emit) {
    String message = 'An error occurred';
    String? code;

    if (e is ApiException) {
      message = e.message;
      code = e.code;
    }

    emit(CustomerError(message: message, code: code));
  }
}

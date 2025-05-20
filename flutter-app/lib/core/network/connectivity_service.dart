import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Connectivity service to manage network connection monitoring
class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _connectionStatusController = StreamController<bool>.broadcast();
  
  bool _isConnected = true;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  
  /// Initialize connectivity monitoring
  ConnectivityService() {
    _initConnectivity();
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(_updateConnectionStatus);
  }
  
  /// Stream of connection status changes
  Stream<bool> get connectionStream => _connectionStatusController.stream;
  
  /// Current connection status
  bool get isConnected => _isConnected;
  
  /// Initialize connectivity monitoring and get initial status
  Future<void> _initConnectivity() async {
    try {
      final result = await _connectivity.checkConnectivity();
      _updateConnectionStatus(result);
    } catch (e) {
      debugPrint('Error checking connectivity: $e');
      _isConnected = false;
      _connectionStatusController.add(false);
    }
  }
  
  /// Update connection status based on connectivity result
  void _updateConnectionStatus(ConnectivityResult result) {
    final bool wasConnected = _isConnected;
    _isConnected = result != ConnectivityResult.none;
    
    // Only notify listeners if the status changed
    if (wasConnected != _isConnected) {
      debugPrint('Connection status changed: $_isConnected');
      _connectionStatusController.add(_isConnected);
    }
  }
  
  /// Dispose resources
  void dispose() {
    _connectivitySubscription?.cancel();
    _connectionStatusController.close();
  }
}

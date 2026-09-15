// lib/core/network/socket_service.dart
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  IO.Socket? _socket;

  void connect({
    required String baseUrl,
    required String riderId,
    required void Function(Map<String, dynamic> data) onTripUpdate,
    required void Function(Map<String, dynamic> data) onDriverLocation
  }) {
    debugPrint('🔌 Setting up socket for $baseUrl');

    _socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    // Register ALL listeners first
    _socket!.onConnect((_) {
      debugPrint('✅ Socket connected, joining room for rider: $riderId');
      _socket!.emit('join', riderId);
    });

    _socket!.onConnectError((err) {
      debugPrint('❌ Socket connect error: $err');
    });

    _socket!.onError((err) {
      debugPrint('❌ Socket error: $err');
    });

    _socket!.on('trip:update', (data) {
      debugPrint('📩 Received trip:update event: $data');
      onTripUpdate(Map<String, dynamic>.from(data));
    });

    _socket!.on('driver:location',(data) {
      debugPrint('Received driver:location update : $data');
      onDriverLocation(Map<String, dynamic>.from(data));
    });

    _socket!.onDisconnect((_) {
      debugPrint('🔌 Socket disconnected');
    });

    // THEN connect
    _socket!.connect();
  }

  void disconnect() {
    debugPrint('🔌 Disconnecting socket');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
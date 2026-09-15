import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  final FlutterSecureStorage _storage;

  const SecureStorage({
    FlutterSecureStorage storage = const FlutterSecureStorage(),
  }) : _storage = storage;

  Future<void> saveAccessToken(String token) async {
    await _storage.write(
      key: 'access_token',
      value: token,
    );
  }

  Future<String?> getAccessToken() async {
    return _storage.read(
      key: 'access_token',
    );
  }

  Future<void> deleteAccessToken() async {
    await _storage.delete(
      key: 'access_token',
    );
  }
}
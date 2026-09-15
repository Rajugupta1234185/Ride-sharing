import 'package:dio/dio.dart';

import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  final Dio dio;
  final SecureStorage _secureStorage = SecureStorage();

  ApiClient()
      : dio = Dio(
          BaseOptions(
            baseUrl: ApiConstants.baseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _secureStorage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
      ),
    );
  }

  Future<Response<dynamic>> post(
    String path, {
    Map<String, dynamic>? data,
  }) async {
    return dio.post(
      path,
      data: data,
    );
  }

  Future<Response<dynamic>> get(
    String path,
  ) async {
    return dio.get(path);
  }

  Future<Response<dynamic>> put(
    String path, {
    Map<String, dynamic>? data,
  }) async {
    return dio.put(
      path,
      data: data,
    );
  }

  Future<Response<dynamic>> delete(
    String path,
  ) async {
    return dio.delete(path);
  }
}
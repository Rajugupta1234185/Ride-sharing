import 'package:flutter/foundation.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/constants/api_constants.dart';

class LoginViewModel extends ChangeNotifier {
  final ApiClient apiClient;
  final SecureStorage secureStorage;

  LoginViewModel({
    required this.apiClient,
    required this.secureStorage,
  });

  bool isLoading = false;
  String? errorMessage;

  Future<bool> login(String email, String password) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await apiClient.post(
        ApiConstants.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      final token = response.data['accessToken'];

      await secureStorage.saveAccessToken(token);

      return true;
    } catch (e) {
      errorMessage = e.toString();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
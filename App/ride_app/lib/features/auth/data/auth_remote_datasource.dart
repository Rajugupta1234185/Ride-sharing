import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import './models/login_response_model.dart';

class AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSource(this.apiClient);

  Future<LoginResponseModel> login({
    required String email,
    required String password,
  }) async {
    final response = await apiClient.post(
      ApiConstants.login,
      data: {
        'email': email,
        'password': password,
      },
    );

    return LoginResponseModel.fromJson(
      response.data as Map<String, dynamic>,
    );
  }
}
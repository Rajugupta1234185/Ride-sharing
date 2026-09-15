class LoginResponseModel {
  final String accessToken;

  const LoginResponseModel({
    required this.accessToken,
  });

  factory LoginResponseModel.fromJson(Map<String, dynamic> json) {
    return LoginResponseModel(
      accessToken: json['accessToken'] as String,
    );
  }
}
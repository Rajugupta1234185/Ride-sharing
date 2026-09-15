class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'http://10.76.200.107:3000';
  static const String socketUrl = 'http://10.76.200.107:3002';
  static const String locationServiceUrl = 'http://10.76.200.107:3004';

  static const String login = '/auth/login';
  static const String trip ='/trips';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
}
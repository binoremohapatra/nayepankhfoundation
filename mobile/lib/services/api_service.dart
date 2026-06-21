import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Android emulator routes to host via 10.0.2.2
  // For physical device on same WiFi, replace with your machine's LAN IP
  static const String _baseUrl = 'http://10.0.2.2:8080';

  static Future<Map<String, dynamic>> registerVolunteer({
    required String name,
    required String email,
    required String phone,
    required String skills,
    required String availability,
    required String comments,
  }) async {
    final uri = Uri.parse('$_baseUrl/api/volunteers');
    try {
      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'name': name,
              'email': email,
              'phone': phone,
              'skills': skills,
              'availability': availability,
              'comments': comments,
            }),
          )
          .timeout(const Duration(seconds: 10));

      final body = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': body};
      } else {
        return {
          'success': false,
          'message': body['message'] ?? 'Server error (${response.statusCode})',
        };
      }
    } on Exception catch (e) {
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}. Is the backend running?',
      };
    }
  }
}

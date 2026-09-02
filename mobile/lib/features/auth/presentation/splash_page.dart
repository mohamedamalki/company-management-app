import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../core/api/api_client.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  static const _minimumDisplayTime = Duration(seconds: 2);

  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _restoreSession();
      }
    });
  }

  Future<void> _restoreSession() async {
    if (mounted && _error != null) {
      setState(() => _error = null);
    }

    final minimumDisplay = Future<void>.delayed(_minimumDisplayTime);

    try {
      final token = await ApiClient.getToken();

      if (token == null || token.isEmpty) {
        await minimumDisplay;

        if (mounted) {
          _openLogin();
        }
        return;
      }

      final response = await ApiClient.dio.get('/me');

      final data = response.data;

      dynamic user;

      if (data is Map) {
        user = data['data'] ?? data['user'] ?? data;
      }

      await minimumDisplay;

      if (!mounted) return;

      Navigator.pushReplacementNamed(
        context,
        '/dashboard',
        arguments: user,
      );
    } on DioException catch (error) {
      if (!mounted) return;

      if (error.response?.statusCode == 401) {
        await _clearSessionAndOpenLogin();
        return;
      }

      setState(() => _error = _restoreErrorMessage(error));
    } catch (_) {
      if (!mounted) return;

      setState(() {
        _error = 'Unable to restore your session.';
      });
    }
  }

  void _openLogin() {
    Navigator.pushReplacementNamed(
      context,
      '/login',
    );
  }

  String _restoreErrorMessage(DioException error) {
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return 'Unable to connect to the server. Check your connection and try again.';
    }

    final data = error.response?.data;
    if (data is Map && data['message'] != null) {
      return data['message'].toString();
    }

    final statusCode = error.response?.statusCode;
    if (statusCode != null) {
      return 'The server could not restore your session (HTTP $statusCode).';
    }

    return 'Unable to restore your session.';
  }

  Future<void> _clearSessionAndOpenLogin() async {
    try {
      await ApiClient.clearToken();
    } catch (_) {
      // A storage failure should not prevent the user from reaching login.
    }

    if (mounted) {
      _openLogin();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: _error == null
                ? const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircleAvatar(
                        radius: 34,
                        backgroundColor:
                            Color(0xFF2563EB),
                        child: Icon(
                          Icons.inventory_2_outlined,
                          size: 34,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(height: 24),
                      Text(
                        'Business Management',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      SizedBox(height: 24),
                      CircularProgressIndicator(),
                      SizedBox(height: 12),
                      Text(
                        'Restoring your session...',
                        style: TextStyle(
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.cloud_off_outlined,
                        size: 52,
                        color: Color(0xFFDC2626),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF475569),
                        ),
                      ),
                      const SizedBox(height: 20),
                      FilledButton.icon(
                        onPressed: _restoreSession,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Try again'),
                      ),
                      TextButton(
                        onPressed: _clearSessionAndOpenLogin,
                        child: const Text('Return to login'),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

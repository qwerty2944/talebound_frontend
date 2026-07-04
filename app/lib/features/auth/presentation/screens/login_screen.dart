import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_exception.dart';
import '../controllers/auth_controller.dart';

enum _AuthMode { signIn, signUp, resetPassword }

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  _AuthMode _mode = _AuthMode.signIn;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final controller = ref.read(authControllerProvider.notifier);
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    switch (_mode) {
      case _AuthMode.signIn:
        await controller.signIn(email: email, password: password);
      case _AuthMode.signUp:
        await controller.signUp(email: email, password: password);
      case _AuthMode.resetPassword:
        await controller.resetPassword(email: email, password: password);
    }
  }

  String get _submitLabel => switch (_mode) {
        _AuthMode.signIn => '로그인',
        _AuthMode.signUp => '회원가입',
        _AuthMode.resetPassword => '비밀번호 재설정',
      };

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    ref.listen(authControllerProvider, (_, next) {
      final error = next.error;
      if (error == null) return;
      // 백필 유저는 비밀번호 재설정 화면으로 유도
      if (error is ApiException && error.isPasswordResetRequired) {
        setState(() => _mode = _AuthMode.resetPassword);
      }
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.toString())));
    });

    return Scaffold(
      appBar: AppBar(title: const Text('MUD')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_mode == _AuthMode.resetPassword)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 16),
                      child: Text('기존 계정은 새 비밀번호 설정이 필요합니다.'),
                    ),
                  TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: '이메일'),
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    validator: (v) =>
                        (v == null || !v.contains('@')) ? '이메일 형식이 아닙니다' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _passwordController,
                    decoration: InputDecoration(
                      labelText:
                          _mode == _AuthMode.resetPassword ? '새 비밀번호' : '비밀번호',
                    ),
                    obscureText: true,
                    validator: (v) =>
                        (v == null || v.length < 6) ? '6자 이상 입력하세요' : null,
                    onFieldSubmitted: (_) => _submit(),
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: auth.isLoading ? null : _submit,
                    child: auth.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(_submitLabel),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => setState(() {
                      _mode = _mode == _AuthMode.signIn
                          ? _AuthMode.signUp
                          : _AuthMode.signIn;
                    }),
                    child: Text(
                      _mode == _AuthMode.signIn ? '계정이 없나요? 회원가입' : '로그인으로 돌아가기',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

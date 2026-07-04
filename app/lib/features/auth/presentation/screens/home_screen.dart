import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/auth_session.dart';
import '../controllers/auth_controller.dart';

/// 로그인 후 임시 홈. 게임 화면은 다음 단계에서 붙인다.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key, required this.session});

  final AuthSession session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MUD'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () =>
                ref.read(authControllerProvider.notifier).signOut(),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(session.user.email,
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(session.hasCharacter ? '캐릭터 있음' : '캐릭터 생성 필요'),
          ],
        ),
      ),
    );
  }
}

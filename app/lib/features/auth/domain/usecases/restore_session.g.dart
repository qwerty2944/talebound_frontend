// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'restore_session.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(restoreSession)
final restoreSessionProvider = RestoreSessionProvider._();

final class RestoreSessionProvider
    extends $FunctionalProvider<RestoreSession, RestoreSession, RestoreSession>
    with $Provider<RestoreSession> {
  RestoreSessionProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'restoreSessionProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$restoreSessionHash();

  @$internal
  @override
  $ProviderElement<RestoreSession> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  RestoreSession create(Ref ref) {
    return restoreSession(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(RestoreSession value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<RestoreSession>(value),
    );
  }
}

String _$restoreSessionHash() => r'db86765b1d10e9fa6b22e91b12438b31ff7f00ea';

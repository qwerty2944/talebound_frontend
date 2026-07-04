// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reset_password.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(resetPassword)
final resetPasswordProvider = ResetPasswordProvider._();

final class ResetPasswordProvider
    extends $FunctionalProvider<ResetPassword, ResetPassword, ResetPassword>
    with $Provider<ResetPassword> {
  ResetPasswordProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'resetPasswordProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$resetPasswordHash();

  @$internal
  @override
  $ProviderElement<ResetPassword> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  ResetPassword create(Ref ref) {
    return resetPassword(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ResetPassword value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ResetPassword>(value),
    );
  }
}

String _$resetPasswordHash() => r'04ba2e8e84e46dd8fafe45f20e49acfff256caf3';

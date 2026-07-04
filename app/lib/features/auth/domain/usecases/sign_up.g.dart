// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sign_up.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(signUp)
final signUpProvider = SignUpProvider._();

final class SignUpProvider extends $FunctionalProvider<SignUp, SignUp, SignUp>
    with $Provider<SignUp> {
  SignUpProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'signUpProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$signUpHash();

  @$internal
  @override
  $ProviderElement<SignUp> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  SignUp create(Ref ref) {
    return signUp(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SignUp value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SignUp>(value),
    );
  }
}

String _$signUpHash() => r'fe5a10892148672e7fb69ee63a75b38e79f5c2c6';

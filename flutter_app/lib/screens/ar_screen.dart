import 'package:flutter/material.dart';
import '../theme.dart';

const String kArWarning =
    'AR shows STORED RECORDS ONLY. It does NOT detect buried pipes.\n'
    'VERIFY BEFORE DIGGING: contact the utility owner, confirm with a licensed '
    'surveyor, and hand-dig or pothole to expose the line first.';

/// AR is temporarily disabled: the ARCore plugin is not part of this build.
/// The AR proof of concept is planned for Phase 3 on an ARCore-supported phone.
class ArScreen extends StatelessWidget {
  const ArScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.view_in_ar_outlined, size: 56, color: Pastel.skyDeep),
              const SizedBox(height: 12),
              const Text(
                'AR view of stored records is planned for Phase 3 (supervised proof of concept).',
                textAlign: TextAlign.center,
                style: TextStyle(color: Pastel.ink, fontSize: 15, height: 1.4),
              ),
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Pastel.warnOrange,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Text(
                  kArWarning,
                  style: TextStyle(
                      color: Pastel.ink, fontWeight: FontWeight.bold, fontSize: 13, height: 1.35),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
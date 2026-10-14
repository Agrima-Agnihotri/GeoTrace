#!/usr/bin/env python3
# Patches the old arcore_flutter_plugin so it builds with modern Android Gradle.
# Run AFTER `flutter pub get`. Safe to run more than once.
import glob
import os
import re
import sys

candidates = []
if os.environ.get("PUB_CACHE"):
    candidates.append(os.environ["PUB_CACHE"])
if os.environ.get("LOCALAPPDATA"):
    candidates.append(os.path.join(os.environ["LOCALAPPDATA"], "Pub", "Cache"))
candidates.append(os.path.expanduser("~/.pub-cache"))

found = []
for base in candidates:
    found += glob.glob(os.path.join(base, "hosted", "pub.dev", "arcore_flutter_plugin-*", "android"))

if not found:
    print("arcore_flutter_plugin not found. Run `flutter pub get` inside flutter_app first.")
    sys.exit(1)

NS = "com.difrancescogianmarco.arcore_flutter_plugin"

for android_dir in found:
    gradle = os.path.join(android_dir, "build.gradle")
    text = open(gradle, encoding="utf-8").read()
    if "namespace" not in text:
        text = text.replace(
            "android {",
            "android {\n    namespace '" + NS + "'",
            1,
        )
    if "kotlinOptions" not in text:
        text = text.replace(
            "android {",
            "android {\n    kotlinOptions { jvmTarget = '1.8' }",
            1,
        )
    text = re.sub(r"compileSdkVersion\s+\d+", "compileSdkVersion 34", text)
    open(gradle, "w", encoding="utf-8").write(text)

    manifest = os.path.join(android_dir, "src", "main", "AndroidManifest.xml")
    if os.path.exists(manifest):
        m = open(manifest, encoding="utf-8").read()
        m = re.sub(r'\s+package="[^"]*"', "", m, count=1)
        open(manifest, "w", encoding="utf-8").write(m)
    print("Patched", android_dir)

print("Done. Now run: flutter clean  then  flutter run")

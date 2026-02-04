[app]

# Application title
title = Aerium Alarm

# Package name
package.name = aeriumalarm

# Package domain (used for Android package)
package.domain = com.aerium

# Source code directory
source.dir = .

# Source include patterns
source.include_exts = py,png,jpg,kv,atlas,json

# Version
version = 1.0.0

# Application requirements
requirements = python3,kivy,kivymd,requests,certifi,charset-normalizer,urllib3,idna

# Android specific
android.permissions = INTERNET,ACCESS_NETWORK_STATE,VIBRATE,WAKE_LOCK
android.api = 31
android.minapi = 21
android.ndk = 25b
android.accept_sdk_license = True

# iOS specific
ios.kivy_ios_url = https://github.com/kivy/kivy-ios
ios.kivy_ios_branch = master

# Application icon
#icon.filename = %(source.dir)s/assets/icon.png

# Splash screen
#presplash.filename = %(source.dir)s/assets/splash.png

# Orientation
orientation = portrait

# Fullscreen
fullscreen = 0

# Logging
log_level = 2
warn_on_root = 1

[buildozer]
# Log level (0 = error only, 1 = info, 2 = debug)
log_level = 2

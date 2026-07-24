
export ANDROID_HOME=/opt/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk

npm run build
npx cap run android

# export PATH=$ANDROID_HOME/tools/bin:$PATH
# export PATH=$ANDROID_HOME/tools:$PATH
# export PATH=$ANDROID_HOME/emulator:$PATH
# export PATH=$ANDROID_HOME/platform-tools:$PATH
# export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
# export PATH=$ANDROID_HOME/cmdline-tools/latest:$PATH
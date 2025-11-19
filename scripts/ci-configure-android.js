import fs from 'fs';
import path from 'path';

const ANDROID_MAIN_PATH = 'android/app/src/main/java/com/subsonic/geministreamer';
const GRADLE_PATH = 'android/app/build.gradle';
const MAIN_ACTIVITY_PATH = path.join(ANDROID_MAIN_PATH, 'MainActivity.java');
const SOURCE_JAVA_PATH = 'native/NativeCast.java';
const DEST_JAVA_PATH = path.join(ANDROID_MAIN_PATH, 'NativeCast.java');

console.log("--- Starting Android CI Configuration ---");

// 1. Copy NativeCast.java
if (fs.existsSync(SOURCE_JAVA_PATH)) {
    // Ensure destination dir exists
    if (!fs.existsSync(ANDROID_MAIN_PATH)) {
        fs.mkdirSync(ANDROID_MAIN_PATH, { recursive: true });
    }
    
    const javaContent = fs.readFileSync(SOURCE_JAVA_PATH, 'utf-8');
    fs.writeFileSync(DEST_JAVA_PATH, javaContent);
    console.log(`✅ Copied ${SOURCE_JAVA_PATH} to ${DEST_JAVA_PATH}`);
} else {
    console.error(`❌ Could not find source file: ${SOURCE_JAVA_PATH}`);
    process.exit(1);
}

// 2. Modify build.gradle to add dependencies
if (fs.existsSync(GRADLE_PATH)) {
    let gradleContent = fs.readFileSync(GRADLE_PATH, 'utf-8');
    
    if (!gradleContent.includes('play-services-cast-framework')) {
        const depString = `    implementation 'com.google.android.gms:play-services-cast-framework:21.4.0'\n`;
        // Insert inside dependencies { ... }
        gradleContent = gradleContent.replace(/dependencies\s*\{/, `dependencies {\n${depString}`);
        fs.writeFileSync(GRADLE_PATH, gradleContent);
        console.log(`✅ Injected Cast dependencies into build.gradle`);
    } else {
        console.log(`ℹ️ Cast dependencies already present in build.gradle`);
    }
} else {
    console.error(`❌ Could not find build.gradle at ${GRADLE_PATH}`);
    process.exit(1);
}

// 3. Register Plugin in MainActivity.java
if (fs.existsSync(MAIN_ACTIVITY_PATH)) {
    let activityContent = fs.readFileSync(MAIN_ACTIVITY_PATH, 'utf-8');
    
    // Check if registerPlugin is already there to avoid duplicates
    if (!activityContent.includes('registerPlugin(NativeCast.class)')) {
        // We need to insert it into onCreate. 
        // Capacitor 6 MainActivity usually extends BridgeActivity and has onCreate.
        // If it doesn't exist in the file (default template might just inherit), we might need to add the method.
        // However, standard BridgeActivity automatically loads plugins if we add them via .add() in init, 
        // OR we can use the newer registerPlugin method inside onCreate.
        
        // Simple approach: Look for existing onCreate or append it.
        // Typically: super.onCreate(savedInstanceState);
        
        const insertionPoint = 'super.onCreate(savedInstanceState);';
        if (activityContent.includes(insertionPoint)) {
             activityContent = activityContent.replace(
                 insertionPoint, 
                 `registerPlugin(NativeCast.class);\n        ${insertionPoint}`
             );
             console.log(`✅ Registered NativeCast in MainActivity.java`);
        } else {
            // Fallback: Try to find class definition and inject onCreate if missing (riskier)
            console.warn(`⚠️ Could not find super.onCreate insertion point in MainActivity. Is it a standard Capacitor activity?`);
        }
        
        fs.writeFileSync(MAIN_ACTIVITY_PATH, activityContent);
    }
} else {
    console.error(`❌ Could not find MainActivity at ${MAIN_ACTIVITY_PATH}`);
    // Don't fail build, might be a different structure, but warn.
}

console.log("--- Configuration Complete ---");

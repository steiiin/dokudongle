package com.steiiin.dokudongle;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import no.nordicsemi.android.dfu.DfuServiceInitiator;

@CapacitorPlugin(name = "DongleFirmware", permissions = {
    @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
})
public class DongleFirmwarePlugin extends Plugin {
    @Override public void load() { FirmwareUpdateState.observe(this); }
    void emit(JSObject state) { notifyListeners("status", state); }

    @PluginMethod public void getStatus(PluginCall call) {
        synchronized (FirmwareUpdateState.class) {
            JSObject state = FirmwareUpdateState.read(getContext());
            String phase = state.optString("phase");
            if (!FirmwareUpdateState.busy && (phase.equals("preparing") || phase.equals("transferring") || phase.equals("restarting"))) {
                state.put("phase", "error").put("error", "Aktualisierung durch App-Neustart unterbrochen. Bitte das Update erneut versuchen. Dongle angeschlossen lassen und Bluetooth einschalten.");
                FirmwareUpdateState.write(getContext(), state);
            }
            call.resolve(FirmwareUpdateState.read(getContext()));
        }
    }
    @PluginMethod public void start(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") == PermissionState.PROMPT) {
            requestPermissionForAlias("notifications", call, "notificationResult");
            return;
        }
        begin(call);
    }
    @PermissionCallback private void notificationResult(PluginCall call) { begin(call); }

    private void begin(PluginCall call) {
        String address = call.getString("deviceId");
        String dfuAddress = call.getString("dfuDeviceId");
        final String jobId = UUID.randomUUID().toString();
        // Firmware versions are uint32; getLong handles the complete supported range.
        Object versionValue = call.getData().opt("version");
        Long expectedVersion = versionValue instanceof Number ? ((Number) versionValue).longValue() : null;
        if (address == null || !BluetoothAdapter.checkBluetoothAddress(address)
            || (dfuAddress != null && !FirmwareRecoveryPolicy.matchesAddress(address, dfuAddress)) || expectedVersion == null || expectedVersion < 1 || expectedVersion > 0xfffffffeL
            || ((Number) versionValue).doubleValue() != expectedVersion.doubleValue()) {
            call.reject("Ungültiges Update-Ziel."); return;
        }
        synchronized (FirmwareUpdateState.class) {
            if (FirmwareUpdateState.busy || FirmwareUpdateState.serviceRunning || FirmwareUpdateState.read(getContext()).optString("phase").equals("transferred")) { call.reject("Eine Aktualisierung läuft bereits."); return; }
            FirmwareUpdateState.busy = true;
            JSObject state = new JSObject().put("jobId", jobId).put("deviceId", address)
                .put("deviceName", call.getString("deviceName", "DokuDongle")).put("version", expectedVersion)
                .put("phase", "preparing").put("progress", 0);
            if (dfuAddress != null) state.put("dfuDeviceId", dfuAddress);
            state.put("recovery", FirmwareUpdateState.recoveryFor(state));
            try { FirmwareUpdateState.write(getContext(), state); }
            catch (Exception error) {
                FirmwareUpdateState.busy = false;
                call.reject("Update-Status konnte nicht gespeichert werden.", error); return;
            }
        }
        execute(() -> {
            try {
                JSObject manifest;
                try (InputStream input = getContext().getAssets().open("public/firmware/manifest.json")) {
                    manifest = new JSObject(new String(readAll(input), StandardCharsets.UTF_8));
                }
                String fileName = manifest.getString("packageFilename");
                if (manifest.getLong("version") != expectedVersion || !"xiao-nrf52840".equals(manifest.getString("target"))
                    || manifest.getInt("targetId") != 1 || manifest.getInt("protocolRevision") != 1
                    || !fileName.matches("dongle-v[0-9]+-[a-f0-9]{16}\\.zip")) throw new Exception("Firmware-Ziel stimmt nicht überein.");
                File file = new File(getContext().getCacheDir(), "dongle-update.zip");
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                try (InputStream input = getContext().getAssets().open("public/firmware/" + fileName);
                     FileOutputStream output = new FileOutputStream(file)) {
                    byte[] buffer = new byte[8192]; int length;
                    while ((length = input.read(buffer)) != -1) { output.write(buffer, 0, length); digest.update(buffer, 0, length); }
                }
                StringBuilder hash = new StringBuilder();
                for (byte b : digest.digest()) hash.append(String.format("%02x", b & 255));
                if (!hash.toString().equals(manifest.getString("packageSha256"))) throw new Exception("Firmware-Prüfsumme stimmt nicht überein.");
                DfuServiceInitiator.createDfuNotificationChannel(getContext(), "Dongle-Aktualisierung", "Fortschritt der Dongle-Aktualisierung", false);
                FirmwareUpdateState.serviceRunning = true;
                new DfuServiceInitiator(dfuAddress != null ? dfuAddress : address).setDeviceName(call.getString("deviceName", "DokuDongle"))
                    .setZip(file.getAbsolutePath()).setScope(DfuServiceInitiator.SCOPE_APPLICATION).setForeground(true)
                    .setPacketsReceiptNotificationsEnabled(true).setPacketsReceiptNotificationsValue(8)
                    .disableMtuRequest().setNumberOfRetries(1).setKeepBond(false)
                    // OTAFIX may advertise at the incremented address after entering DFU.
                    .setForceScanningForNewAddressInLegacyDfu(true)
                    .start(getContext(), FirmwareDfuService.class);
                call.resolve(FirmwareUpdateState.read(getContext()));
            } catch (Exception error) {
                FirmwareUpdateState.serviceRunning = false;
                FirmwareUpdateState.phase(getContext(), jobId, "error", 0, "Aktualisierung konnte nicht gestartet werden: " + error.getMessage());
                call.reject("Aktualisierung konnte nicht gestartet werden.", error);
            }
        });
    }
    private static byte[] readAll(InputStream input) throws Exception {
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        byte[] buffer = new byte[4096]; int length;
        while ((length = input.read(buffer)) != -1) output.write(buffer, 0, length);
        return output.toByteArray();
    }
    @PluginMethod public void finish(PluginCall call) {
        synchronized (FirmwareUpdateState.class) {
            JSObject state = FirmwareUpdateState.read(getContext());
            if (FirmwareUpdateState.busy || !state.optString("jobId").equals(call.getString("jobId")) || !state.optString("phase").equals("transferred")) {
                call.reject("Aktualisierung kann noch nicht bestätigt werden."); return;
            }
            boolean verified = Boolean.TRUE.equals(call.getBoolean("verified"));
            state.put("phase", verified ? "done" : "error").put("error", verified ? null : "Installation konnte nach dem Neustart nicht bestätigt werden. Bitte das Update erneut versuchen. Dongle angeschlossen lassen und Bluetooth einschalten.");
            FirmwareUpdateState.write(getContext(), state);
            call.resolve(FirmwareUpdateState.read(getContext()));
        }
    }
    /** Called only after the app read the exact attempted version from the original application. */
    @PluginMethod public void clearRecovery(PluginCall call) {
        synchronized (FirmwareUpdateState.class) {
            JSObject state = FirmwareUpdateState.read(getContext());
            org.json.JSONObject recovery = state.optJSONObject("recovery");
            if (FirmwareUpdateState.busy || FirmwareUpdateState.serviceRunning || recovery == null
                || !recovery.optString("jobId").equals(call.getString("jobId"))
                || recovery.optLong("version") != call.getData().optLong("version", -1)) {
                call.reject("Veraltete oder noch laufende Wiederherstellung."); return;
            }
            JSObject done = new JSObject().put("phase", "done").put("jobId", recovery.optString("jobId"))
                .put("deviceId", recovery.optString("deviceId")).put("deviceName", recovery.optString("deviceName"))
                .put("version", recovery.optLong("version"));
            FirmwareUpdateState.write(getContext(), done);
            call.resolve(FirmwareUpdateState.read(getContext()));
        }
    }
    @PluginMethod public void dismiss(PluginCall call) {
        synchronized (FirmwareUpdateState.class) {
            JSObject state = FirmwareUpdateState.read(getContext());
            if (FirmwareUpdateState.busy || state.optString("phase").equals("transferred")) { call.reject("Aktualisierung läuft noch."); return; }
            if (!state.optString("jobId").equals(call.getString("jobId"))) { call.reject("Veraltete Aktualisierung."); return; }
            FirmwareUpdateState.write(getContext(), new JSObject().put("phase", "idle"));
            call.resolve();
        }
    }
}

package com.steiiin.dokudongle;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import org.json.JSONObject;
import java.lang.ref.WeakReference;

/** Native state survives a WebView recreation; recovery survives dialog dismissal. */
final class FirmwareUpdateState {
    private static WeakReference<DongleFirmwarePlugin> observer = new WeakReference<>(null);
    static volatile boolean busy;
    // Terminal progress can arrive before the old service is destroyed. Do not reuse it.
    static volatile boolean serviceRunning;
    static synchronized void observe(DongleFirmwarePlugin plugin) { observer = new WeakReference<>(plugin); }
    static synchronized JSObject read(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("dongleFirmware", Context.MODE_PRIVATE);
        JSObject status;
        try { status = new JSObject(prefs.getString("status", "{\"phase\":\"idle\",\"updatedAt\":0}")); }
        catch (Exception error) { status = new JSObject().put("phase", "idle").put("updatedAt", 0); }
        try {
            String saved = prefs.getString("recovery", null);
            if (saved != null) status.put("recovery", new JSObject(saved));
            // Upgrade existing interrupted jobs without losing their device identity.
            else if (!status.optString("phase").equals("done") && status.has("jobId") && status.has("deviceId") && status.has("version")) {
                status.put("recovery", recoveryFor(status));
            }
        } catch (Exception ignored) { /* A corrupt record must not prevent normal updates. */ }
        return status;
    }
    static JSObject recoveryFor(JSObject status) {
        JSObject recovery = new JSObject().put("jobId", status.optString("jobId"))
            .put("deviceId", status.optString("deviceId")).put("deviceName", status.optString("deviceName", "DokuDongle"))
            .put("version", status.optLong("version"));
        if (status.has("dfuDeviceId")) recovery.put("dfuDeviceId", status.optString("dfuDeviceId"));
        return recovery;
    }
    static synchronized void write(Context context, JSObject status) {
        JSObject previous = read(context);
        JSONObject recovery = status.optJSONObject("recovery");
        if (recovery == null) recovery = previous.optJSONObject("recovery");
        status.put("updatedAt", Math.max(System.currentTimeMillis(), previous.optLong("updatedAt") + 1));
        status.remove("recovery");
        SharedPreferences.Editor edit = context.getSharedPreferences("dongleFirmware", Context.MODE_PRIVATE).edit()
            .putString("status", status.toString());
        if (status.optString("phase").equals("done")) edit.remove("recovery");
        else if (recovery != null) edit.putString("recovery", recovery.toString());
        if (!edit.commit()) throw new IllegalStateException("Update-Status konnte nicht gespeichert werden.");
        DongleFirmwarePlugin plugin = observer.get();
        if (plugin != null) plugin.emit(read(context));
    }
    static synchronized void phase(Context context, String jobId, String phase, int progress, String error) {
        JSObject status = read(context);
        if (!busy || !status.optString("jobId").equals(jobId)) return;
        status.put("phase", phase).put("progress", progress).put("error", error);
        write(context, status);
        if (phase.equals("transferred") || phase.equals("error")) busy = false;
    }
    static synchronized void rememberDfuAddress(Context context, String jobId, String address) {
        JSObject status = read(context);
        if (!busy || !status.optString("jobId").equals(jobId)
            || !FirmwareRecoveryPolicy.matchesAddress(status.optString("deviceId"), address)) return;
        if (address.equals(status.optString("dfuDeviceId"))) return;
        status.put("dfuDeviceId", address);
        status.put("recovery", recoveryFor(status));
        write(context, status);
    }
}

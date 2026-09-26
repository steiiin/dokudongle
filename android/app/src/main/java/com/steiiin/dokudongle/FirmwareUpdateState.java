package com.steiiin.dokudongle;

import android.content.Context;
import com.getcapacitor.JSObject;
import java.lang.ref.WeakReference;

/** Native state survives a WebView recreation; persisted state detects process death. */
final class FirmwareUpdateState {
    private static WeakReference<DongleFirmwarePlugin> observer = new WeakReference<>(null);
    static boolean busy;
    static synchronized void observe(DongleFirmwarePlugin plugin) { observer = new WeakReference<>(plugin); }
    static synchronized JSObject read(Context context) {
        try {
            return new JSObject(context.getSharedPreferences("dongleFirmware", Context.MODE_PRIVATE).getString("status", "{\"phase\":\"idle\",\"updatedAt\":0}"));
        } catch (Exception error) { return new JSObject().put("phase", "idle").put("updatedAt", 0); }
    }
    static synchronized void write(Context context, JSObject status) {
        status.put("updatedAt", Math.max(System.currentTimeMillis(), read(context).optLong("updatedAt") + 1));
        context.getSharedPreferences("dongleFirmware", Context.MODE_PRIVATE).edit().putString("status", status.toString()).commit();
        DongleFirmwarePlugin plugin = observer.get();
        if (plugin != null) plugin.emit(status);
    }
    static synchronized void phase(Context context, String phase, int progress, String error) {
        JSObject status = read(context);
        if (!busy) return; // Ignore late callbacks after a terminal event.
        status.put("phase", phase).put("progress", progress).put("error", error);
        if (phase.equals("transferred") || phase.equals("error")) busy = false;
        write(context, status);
    }
}

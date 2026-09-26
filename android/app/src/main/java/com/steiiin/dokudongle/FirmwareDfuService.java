package com.steiiin.dokudongle;

import android.app.Activity;
import no.nordicsemi.android.dfu.DfuBaseService;
import no.nordicsemi.android.dfu.DfuProgressListenerAdapter;
import no.nordicsemi.android.dfu.DfuServiceListenerHelper;

public class FirmwareDfuService extends DfuBaseService {
    private String jobId;
    private final DfuProgressListenerAdapter listener = new DfuProgressListenerAdapter() {
        @Override public void onDeviceConnecting(String address) { phase("preparing", 0, null); }
        @Override public void onDfuProcessStarting(String address) { phase("preparing", 0, null); }
        @Override public void onEnablingDfuMode(String address) { phase("preparing", 0, null); }
        @Override public void onProgressChanged(String address, int percent, float speed, float averageSpeed, int part, int parts) { FirmwareUpdateState.rememberDfuAddress(FirmwareDfuService.this, jobId, address); phase("transferring", percent, null); }
        @Override public void onFirmwareValidating(String address) { phase("restarting", 100, null); }
        @Override public void onDfuCompleted(String address) { phase("transferred", 100, null); }
        @Override public void onDfuAborted(String address) { phase("error", 0, "Aktualisierung abgebrochen. Bitte das Update erneut versuchen."); }
        @Override public void onError(String address, int error, int type, String message) {
            phase("error", 0, "Bluetooth-Update fehlgeschlagen (" + error + "): " + message + ". Bitte das Update erneut versuchen. Dongle angeschlossen lassen und Bluetooth einschalten.");
        }
    };
    private void phase(String phase, int progress, String error) { FirmwareUpdateState.phase(this, jobId, phase, progress, error); }
    @Override public void onCreate() {
        super.onCreate();
        synchronized (FirmwareUpdateState.class) {
            jobId = FirmwareUpdateState.read(this).optString("jobId");
            FirmwareUpdateState.serviceRunning = true;
        }
        DfuServiceListenerHelper.registerProgressListener(this, listener);
    }
    @Override public void onDestroy() {
        DfuServiceListenerHelper.unregisterProgressListener(this, listener);
        super.onDestroy();
        // A killed service must not leave the UI permanently locked.
        synchronized (FirmwareUpdateState.class) {
            try {
                phase("error", 0, "Aktualisierung unterbrochen. Bitte das Update erneut versuchen. Dongle angeschlossen lassen und Bluetooth einschalten.");
            } finally {
                // Dismissal may have removed the status job ID. No newer service
                // can start while serviceRunning is true, so always release it.
                FirmwareUpdateState.serviceRunning = false;
            }
        }
    }
    @Override protected Class<? extends Activity> getNotificationTarget() { return MainActivity.class; }
    @Override protected boolean isDebug() { return false; }
}

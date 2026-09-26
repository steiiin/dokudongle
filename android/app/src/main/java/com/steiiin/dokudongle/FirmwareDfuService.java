package com.steiiin.dokudongle;

import android.app.Activity;
import no.nordicsemi.android.dfu.DfuBaseService;
import no.nordicsemi.android.dfu.DfuProgressListenerAdapter;
import no.nordicsemi.android.dfu.DfuServiceListenerHelper;

public class FirmwareDfuService extends DfuBaseService {
    private final DfuProgressListenerAdapter listener = new DfuProgressListenerAdapter() {
        @Override public void onDeviceConnecting(String address) { phase("preparing", 0, null); }
        @Override public void onDfuProcessStarting(String address) { phase("preparing", 0, null); }
        @Override public void onEnablingDfuMode(String address) { phase("preparing", 0, null); }
        @Override public void onProgressChanged(String address, int percent, float speed, float averageSpeed, int part, int parts) { phase("transferring", percent, null); }
        @Override public void onFirmwareValidating(String address) { phase("restarting", 100, null); }
        @Override public void onDfuCompleted(String address) { phase("transferred", 100, null); }
        @Override public void onDfuAborted(String address) { phase("error", 0, "Aktualisierung abgebrochen. Erneut versuchen oder den Dongle über USB wiederherstellen."); }
        @Override public void onError(String address, int error, int type, String message) {
            phase("error", 0, "Bluetooth-Update fehlgeschlagen (" + error + "): " + message + ". Erneut versuchen oder über USB wiederherstellen.");
        }
    };
    private void phase(String phase, int progress, String error) { FirmwareUpdateState.phase(this, phase, progress, error); }
    @Override public void onCreate() {
        super.onCreate();
        DfuServiceListenerHelper.registerProgressListener(this, listener);
    }
    @Override public void onDestroy() {
        DfuServiceListenerHelper.unregisterProgressListener(this, listener);
        super.onDestroy();
        // A killed service must not leave the UI permanently locked.
        phase("error", 0, "Aktualisierung unterbrochen. Bitte erneut verbinden oder über USB wiederherstellen.");
    }
    @Override protected Class<? extends Activity> getNotificationTarget() { return MainActivity.class; }
    @Override protected boolean isDebug() { return false; }
}

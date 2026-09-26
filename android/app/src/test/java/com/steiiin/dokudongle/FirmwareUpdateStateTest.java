package com.steiiin.dokudongle;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import java.util.HashMap;
import java.util.Map;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class FirmwareUpdateStateTest {
    private final Map<String, String> disk = new HashMap<>();
    private Context context;
    private SharedPreferences.Editor editor;

    @Before public void setUp() {
        context = mock(Context.class);
        SharedPreferences prefs = mock(SharedPreferences.class);
        editor = mock(SharedPreferences.Editor.class);
        Map<String, String> pending = new HashMap<>();
        when(context.getSharedPreferences(eq("dongleFirmware"), anyInt())).thenReturn(prefs);
        when(prefs.getString(anyString(), nullable(String.class))).thenAnswer(call -> disk.getOrDefault(call.getArgument(0), call.getArgument(1)));
        when(prefs.edit()).thenReturn(editor);
        when(editor.putString(anyString(), anyString())).thenAnswer(call -> { pending.put(call.getArgument(0), call.getArgument(1)); return editor; });
        when(editor.remove(anyString())).thenAnswer(call -> { pending.put(call.getArgument(0), null); return editor; });
        when(editor.commit()).thenAnswer(call -> {
            pending.forEach((key, value) -> { if (value == null) disk.remove(key); else disk.put(key, value); });
            pending.clear();
            return true;
        });
        FirmwareUpdateState.busy = false;
        FirmwareUpdateState.serviceRunning = false;
        FirmwareUpdateState.observe(null);
    }

    private JSObject job(String id) {
        JSObject status = new JSObject().put("jobId", id).put("deviceId", "AA:BB:CC:DD:EE:FF")
            .put("deviceName", "DokuDongle-Test").put("version", 3).put("phase", "preparing");
        status.put("recovery", FirmwareUpdateState.recoveryFor(status));
        return status;
    }

    @Test public void dismissalAndProcessRestartPreserveRecoverySeparatelyFromStatus() {
        FirmwareUpdateState.write(context, job("first"));
        FirmwareUpdateState.busy = true;
        FirmwareUpdateState.rememberDfuAddress(context, "first", "AA:BB:CC:DD:EE:00");
        FirmwareUpdateState.phase(context, "first", "error", 20, "Disconnected");
        FirmwareUpdateState.write(context, new JSObject().put("phase", "idle"));
        FirmwareUpdateState.busy = false;
        FirmwareUpdateState.serviceRunning = false;
        JSObject restored = FirmwareUpdateState.read(context);
        assertEquals("idle", restored.optString("phase"));
        assertEquals("first", restored.optJSONObject("recovery").optString("jobId"));
        assertEquals("AA:BB:CC:DD:EE:00", restored.optJSONObject("recovery").optString("dfuDeviceId"));
        assertNotNull(disk.get("recovery"));
        assertFalse(disk.get("status").contains("recovery"));
    }

    @Test public void upgradesOldInterruptedJobsWithoutRecoveryRecord() {
        JSObject legacy = job("legacy");
        legacy.remove("recovery");
        disk.put("status", legacy.toString());
        assertEquals("legacy", FirmwareUpdateState.read(context).optJSONObject("recovery").optString("jobId"));
        FirmwareUpdateState.write(context, new JSObject().put("phase", "idle"));
        assertEquals("legacy", FirmwareUpdateState.read(context).optJSONObject("recovery").optString("jobId"));
    }

    @Test public void repeatedFailuresKeepRecoveryAndOldCallbacksCannotDamageNewAttempt() {
        FirmwareUpdateState.write(context, job("first"));
        FirmwareUpdateState.busy = true;
        FirmwareUpdateState.phase(context, "first", "error", 30, "Disconnected");
        FirmwareUpdateState.write(context, job("second"));
        FirmwareUpdateState.busy = true;
        FirmwareUpdateState.phase(context, "first", "error", 0, "Old service destroyed");
        FirmwareUpdateState.rememberDfuAddress(context, "first", "AA:BB:CC:DD:EE:00");
        assertEquals("preparing", FirmwareUpdateState.read(context).optString("phase"));
        assertEquals("second", FirmwareUpdateState.read(context).optJSONObject("recovery").optString("jobId"));
        assertTrue(FirmwareUpdateState.busy);
        FirmwareUpdateState.phase(context, "second", "error", 50, "Disconnected again");
        assertNotNull(FirmwareUpdateState.read(context).optJSONObject("recovery"));
    }

    @Test public void transferCompletionKeepsRecoveryUntilVersionIsConfirmed() {
        FirmwareUpdateState.write(context, job("first"));
        FirmwareUpdateState.busy = true;
        FirmwareUpdateState.phase(context, "first", "transferred", 100, null);
        assertNotNull(FirmwareUpdateState.read(context).optJSONObject("recovery"));
        JSObject confirmed = FirmwareUpdateState.read(context);
        confirmed.put("phase", "done");
        FirmwareUpdateState.write(context, confirmed);
        FirmwareUpdateState.phase(context, "first", "error", 0, "Late error");
        assertEquals("done", FirmwareUpdateState.read(context).optString("phase"));
        assertNull(FirmwareUpdateState.read(context).optJSONObject("recovery"));
        assertFalse(disk.containsKey("recovery"));
    }

    @Test public void damagedStatusDoesNotLoseIndependentRecoveryRecord() {
        FirmwareUpdateState.write(context, job("first"));
        disk.put("status", "broken");
        assertEquals("idle", FirmwareUpdateState.read(context).optString("phase"));
        assertEquals("first", FirmwareUpdateState.read(context).optJSONObject("recovery").optString("jobId"));
    }

    @Test public void persistenceFailureIsReportedInsteadOfPretendingTheJobIsSafe() {
        when(editor.commit()).thenReturn(false);
        assertThrows(IllegalStateException.class, () -> FirmwareUpdateState.write(context, job("first")));
    }

    @Test public void onlyOriginalOrLastByteIncrementedAddressesAreAccepted() {
        assertTrue(FirmwareRecoveryPolicy.matchesAddress("AA:BB:CC:DD:EE:FF", "AA:BB:CC:DD:EE:FF"));
        assertTrue(FirmwareRecoveryPolicy.matchesAddress("AA:BB:CC:DD:EE:FF", "aa:bb:cc:dd:ee:00"));
        assertFalse(FirmwareRecoveryPolicy.matchesAddress("AA:BB:CC:DD:EE:FF", "AA:BB:CC:DD:EF:00"));
        assertFalse(FirmwareRecoveryPolicy.matchesAddress("AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66"));
        assertFalse(FirmwareRecoveryPolicy.matchesAddress("invalid", "11:22:33:44:55:66"));
    }
}

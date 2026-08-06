package com.steiiin.dokudongle;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "AuditExport")
public class AuditExportPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String content = call.getString("content");
        String fileName = call.getString("fileName");

        if (content == null || fileName == null || fileName.trim().isEmpty()) {
            call.reject("content and fileName are required");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/x-ndjson");
        intent.putExtra(Intent.EXTRA_TITLE, fileName);
        startActivityForResult(call, intent, "handleSaveResult");
    }

    @ActivityCallback
    private void handleSaveResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK) {
            JSObject response = new JSObject();
            response.put("saved", false);
            call.resolve(response);
            return;
        }

        Intent data = result.getData();
        Uri uri = data == null ? null : data.getData();
        if (uri == null) {
            call.reject("No destination was selected");
            return;
        }

        String content = call.getString("content", "");
        execute(() -> writeContent(call, uri, content));
    }

    private void writeContent(PluginCall call, Uri uri, String content) {
        try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "w")) {
            if (output == null) {
                call.reject("Could not open the selected destination");
                return;
            }

            output.write(content.getBytes(StandardCharsets.UTF_8));
            output.flush();

            JSObject response = new JSObject();
            response.put("saved", true);
            call.resolve(response);
        } catch (IOException exception) {
            call.reject("Could not write the audit file", exception);
        }
    }
}

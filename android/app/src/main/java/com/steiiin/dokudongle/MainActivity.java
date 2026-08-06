package com.steiiin.dokudongle;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AuditExportPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

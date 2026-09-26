package com.steiiin.dokudongle;

import java.util.Locale;

final class FirmwareRecoveryPolicy {
    static boolean matchesAddress(String application, String dfu) {
        if (application == null || dfu == null
            || !application.matches("(?i)([0-9a-f]{2}:){5}[0-9a-f]{2}")
            || !dfu.matches("(?i)([0-9a-f]{2}:){5}[0-9a-f]{2}")) return false;
        String incremented = application.substring(0, 15)
            + String.format(Locale.US, "%02X", (Integer.parseInt(application.substring(15), 16) + 1) & 0xFF);
        return application.equalsIgnoreCase(dfu) || incremented.equalsIgnoreCase(dfu);
    }
}

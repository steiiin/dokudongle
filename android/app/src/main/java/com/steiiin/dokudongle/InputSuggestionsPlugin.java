package com.steiiin.dokudongle;

import android.webkit.WebView;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "InputSuggestions")
public class InputSuggestionsPlugin extends Plugin {

    @PluginMethod
    public void setSuggestionsDisabled(PluginCall call) {
        Boolean disabled = call.getBoolean("disabled");
        if (disabled == null) {
            call.reject("disabled is required");
            return;
        }

        getActivity().runOnUiThread(() -> {
            WebView webView = getBridge().getWebView();
            if (!(webView instanceof DodoCapacitorWebView)) {
                call.reject("DodoCapacitorWebView is not active");
                return;
            }

            ((DodoCapacitorWebView) webView).setSuggestionsDisabled(disabled);
            call.resolve();
        });
    }
}

package com.steiiin.dokudongle;

import android.content.Context;
import android.text.InputType;
import android.util.AttributeSet;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodManager;
import com.getcapacitor.CapacitorWebView;

public class DodoCapacitorWebView extends CapacitorWebView {

    private boolean suggestionsDisabled;

    public DodoCapacitorWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public void setSuggestionsDisabled(boolean disabled) {
        if (suggestionsDisabled == disabled) {
            return;
        }

        suggestionsDisabled = disabled;
        InputMethodManager inputMethodManager = (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
        if (inputMethodManager != null) {
            inputMethodManager.restartInput(this);
        }
    }

    @Override
    public InputConnection onCreateInputConnection(EditorInfo outAttrs) {
        InputConnection inputConnection = super.onCreateInputConnection(outAttrs);
        if (suggestionsDisabled) {
            outAttrs.inputType = suppressSuggestions(outAttrs.inputType);
        }
        return inputConnection;
    }

    static int suppressSuggestions(int inputType) {
        if ((inputType & InputType.TYPE_MASK_CLASS) != InputType.TYPE_CLASS_TEXT) {
            return inputType;
        }

        int result = inputType;
        result &= ~InputType.TYPE_TEXT_FLAG_AUTO_CORRECT;
        result &= ~InputType.TYPE_TEXT_FLAG_AUTO_COMPLETE;
        result &= ~InputType.TYPE_MASK_VARIATION;
        result |= InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD;
        result |= InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS;
        return result;
    }
}

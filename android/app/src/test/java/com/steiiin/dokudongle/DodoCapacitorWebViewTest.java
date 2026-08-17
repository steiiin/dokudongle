package com.steiiin.dokudongle;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;

import android.text.InputType;
import org.junit.Test;

public class DodoCapacitorWebViewTest {

    @Test
    public void suppressSuggestionsPreservesMultilineTextInput() {
        int original = InputType.TYPE_CLASS_TEXT
            | InputType.TYPE_TEXT_VARIATION_WEB_EDIT_TEXT
            | InputType.TYPE_TEXT_FLAG_MULTI_LINE
            | InputType.TYPE_TEXT_FLAG_AUTO_CORRECT
            | InputType.TYPE_TEXT_FLAG_AUTO_COMPLETE;

        int result = DodoCapacitorWebView.suppressSuggestions(original);

        assertEquals(InputType.TYPE_CLASS_TEXT, result & InputType.TYPE_MASK_CLASS);
        assertNotEquals(0, result & InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        assertEquals(0, result & InputType.TYPE_TEXT_FLAG_AUTO_CORRECT);
        assertEquals(0, result & InputType.TYPE_TEXT_FLAG_AUTO_COMPLETE);
        assertNotEquals(0, result & InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        assertEquals(InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD, result & InputType.TYPE_MASK_VARIATION);
    }

    @Test
    public void suppressSuggestionsLeavesNonTextInputUnchanged() {
        int original = InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL;

        assertEquals(original, DodoCapacitorWebView.suppressSuggestions(original));
    }
}

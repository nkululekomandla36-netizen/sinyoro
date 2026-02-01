package com.sinyoro.trading

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView
import android.widget.LinearLayout
import android.view.Gravity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Create layout programmatically
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(50, 50, 50, 50)
        }
        
        val textView = TextView(this).apply {
            text = "Sinyoro Trading App\n\nComing Soon!\n\nOffline trading for rural communities"
            textSize = 24f
            gravity = Gravity.CENTER
        }
        
        layout.addView(textView)
        setContentView(layout)
    }
}

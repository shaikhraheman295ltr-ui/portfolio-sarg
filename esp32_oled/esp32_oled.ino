#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDR 0x3C
#define SDA_PIN 21
#define SCL_PIN 22

const char* ssid = "airtel aman";
const char* password = "AMAN825@";

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void showText(String line1, String line2 = "") {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(line1);
  if (line2 != "") {
    display.setCursor(0, 16);
    display.println(line2);
  }
  display.display();
}

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("OLED not found at 0x3C");
    while (true) delay(100);
  }
  display.clearDisplay();
  display.display();

  showText("WiFi:");
  showText("WiFi:", String(ssid));
  showText("Connecting...");

  WiFi.begin(ssid, password);
  int dots = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    dots = (dots + 1) % 4;
    String d = String("Connecting") + String(dots, '.');
    showText(d);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  showText("Connected!", "IP: " + WiFi.localIP().toString());
  delay(3000);
  showText("Connected!", String(WiFi.localIP().toString()));
}

void loop() {
  // showText("Connected", WiFi.localIP().toString());
  delay(10000);
}

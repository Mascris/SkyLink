package com.Delivery.SkyLink.service;

import com.Delivery.SkyLink.model.Hub;
import com.Delivery.SkyLink.model.HubConnection;
import com.Delivery.SkyLink.repository.HubRepository;
import com.Delivery.SkyLink.repository.HubConnectionRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class HubSeeder {

  private final HubRepository hubRepository;
  private final HubConnectionRepository connectionRepository;

  @PostConstruct
  public void seed() {
    if (hubRepository.count() > 5) {
      log.info("🌍 Hubs already seeded ({} hubs found), skipping.", hubRepository.count());
      return;
    }

    log.info("🌍 Seeding maritime hubs and connections...");

    // Clear existing data for a clean seed
    connectionRepository.deleteAll();
    hubRepository.deleteAll();

    // ───── PORTS ─────
    saveHub("SHA", "Shanghai",      "China",         31.23,  121.47, 8);
    saveHub("SIN", "Singapore",     "Singapore",      1.29,  103.85, 8);
    saveHub("RTM", "Rotterdam",     "Netherlands",   51.92,    4.48, 1);
    saveHub("HAM", "Hamburg",       "Germany",       53.55,    9.99, 1);
    saveHub("DXB", "Jebel Ali",    "UAE",           25.01,   55.06, 4);
    saveHub("LAX", "Los Angeles",   "USA",           33.74, -118.27, -8);
    saveHub("NYK", "New York",      "USA",           40.68,  -74.04, -5);
    saveHub("SYD", "Sydney",        "Australia",    -33.86,  151.21, 10);
    saveHub("MUM", "Mumbai",        "India",         18.95,   72.84, 5);
    saveHub("CPT", "Cape Town",     "South Africa", -33.92,   18.42, 2);
    saveHub("TKY", "Tokyo",         "Japan",         35.65,  139.84, 9);
    saveHub("PIR", "Piraeus",       "Greece",        37.94,   23.65, 2);
    saveHub("TAN", "Tanger Med",    "Morocco",       35.87,   -5.50, 0);
    saveHub("JED", "Jeddah",        "Saudi Arabia",  21.49,   39.19, 3);
    saveHub("HKG", "Hong Kong",     "China",         22.29,  114.17, 8);
    saveHub("BUE", "Buenos Aires",  "Argentina",    -34.61,  -58.37, -3);

    // ───── CONNECTIONS (bidirectional via PathfinderService) ─────
    // Mediterranean / Europe
    saveConn("TAN", "PIR", 3);     // Morocco → Greece (Med crossing)
    saveConn("PIR", "RTM", 7);     // Greece → Rotterdam (via Med + Atlantic)
    saveConn("RTM", "HAM", 1);     // Rotterdam → Hamburg (short)
    saveConn("TAN", "RTM", 5);     // Morocco → Rotterdam (Atlantic coast)

    // Suez corridor
    saveConn("PIR", "JED", 3);     // Greece → Jeddah (via Suez)
    saveConn("JED", "DXB", 3);     // Jeddah → Dubai (Red Sea → Gulf)
    saveConn("PIR", "DXB", 5);     // Greece → Dubai (Suez shortcut)

    // Indian Ocean
    saveConn("DXB", "MUM", 3);     // Dubai → Mumbai
    saveConn("MUM", "SIN", 5);     // Mumbai → Singapore
    saveConn("JED", "MUM", 4);     // Jeddah → Mumbai (Arabian Sea)
    saveConn("DXB", "SIN", 6);     // Dubai → Singapore

    // East Asia / Pacific
    saveConn("SIN", "HKG", 4);     // Singapore → Hong Kong
    saveConn("SIN", "SHA", 5);     // Singapore → Shanghai
    saveConn("HKG", "SHA", 2);     // Hong Kong → Shanghai
    saveConn("SHA", "TKY", 3);     // Shanghai → Tokyo
    saveConn("HKG", "TKY", 4);     // Hong Kong → Tokyo

    // Pacific crossings
    saveConn("TKY", "LAX", 12);    // Tokyo → LA (transpacific)
    saveConn("SHA", "LAX", 13);    // Shanghai → LA
    saveConn("SIN", "SYD", 7);     // Singapore → Sydney

    // Americas
    saveConn("LAX", "NYK", 8);     // LA → NY (Panama Canal)
    saveConn("NYK", "RTM", 9);     // NY → Rotterdam (transatlantic)
    saveConn("NYK", "BUE", 10);    // NY → Buenos Aires
    saveConn("NYK", "TAN", 7);     // NY → Morocco (Atlantic)

    // Cape route
    saveConn("CPT", "BUE", 8);     // Cape Town → Buenos Aires
    saveConn("CPT", "MUM", 7);     // Cape Town → Mumbai (Indian Ocean)
    saveConn("CPT", "SIN", 9);     // Cape Town → Singapore
    saveConn("CPT", "RTM", 10);    // Cape Town → Rotterdam

    log.info("✅ Seeded {} hubs and {} connections.",
        hubRepository.count(), connectionRepository.count());
  }

  private void saveHub(String code, String city, String country, double lat, double lng, int tz) {
    Hub h = new Hub();
    h.setHubCode(code);
    h.setCity(city);
    h.setCountry(country);
    h.setLatitude(lat);
    h.setLongtitude(lng);
    h.setTimeZoneOffset(tz);
    hubRepository.save(h);
  }

  private void saveConn(String from, String to, int weight) {
    HubConnection c = new HubConnection();
    c.setFromHub(from);
    c.setToHub(to);
    c.setWeight(weight);
    connectionRepository.save(c);
  }
}

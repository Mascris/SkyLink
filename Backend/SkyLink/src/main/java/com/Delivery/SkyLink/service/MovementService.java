package com.Delivery.SkyLink.service;

import com.Delivery.SkyLink.model.Hub;
import com.Delivery.SkyLink.model.Shipment;
import com.Delivery.SkyLink.repository.HubRepository;
import com.Delivery.SkyLink.repository.ShipmentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
@Slf4j
@RequiredArgsConstructor
public class MovementService {

  private final ShipmentRepository shipmentRepository;
  private final HubRepository hubRepository;
  private final Random random = new Random();

  @Scheduled(fixedRate = 15000)
  public void moveShipments() {
    // ─── Launch queued shipments ───
    List<Shipment> queued = shipmentRepository.findByStatus("IN_QUEUE");
    for (Shipment s : queued) {
      s.setStatus("TRANSIT");
      shipmentRepository.save(s);
      log.info("⚓ SHIPMENT [{}] has left the port! ({} → {})",
          s.getLabel(), s.getCurrentHub(), s.getDestinationHub());
    }

    // ─── Resume delayed shipments (~50% chance per tick) ───
    List<Shipment> delayed = shipmentRepository.findByStatus("DELAYED");
    for (Shipment s : delayed) {
      if (random.nextDouble() < 0.50) {
        s.setStatus("TRANSIT");
        shipmentRepository.save(s);
        log.info("🔄 RESUMED: [{}] is back in transit after delay.", s.getLabel());
      }
    }

    // ─── Move in-transit shipments ───
    List<Shipment> inTransit = shipmentRepository.findByStatus("TRANSIT");
    for (Shipment s : inTransit) {
      // ~10% chance of delay per tick
      if (random.nextDouble() < 0.10) {
        s.setStatus("DELAYED");
        shipmentRepository.save(s);
        log.info("⚠️ DELAYED: [{}] has been delayed!", s.getLabel());
        continue;
      }

      int increment = 5 + random.nextInt(6); // +5% to +10% per tick
      int newProgress = s.getProgressPercent() + increment;

      if (newProgress >= 100) {
        s.setProgressPercent(100);
        s.setStatus("DELIVERED");
        log.info("🏁 ARRIVED: [{}] has reached {} !", s.getLabel(), s.getDestinationHub());
      } else {
        s.setProgressPercent(newProgress);
        updateCoordinates(s);
      }
      shipmentRepository.save(s);
    }

    // Database cleanup (Disabled to allow more shipments)
    /*
    long total = shipmentRepository.count();
    if (total > 5000) { // Increased threshold
      List<Shipment> delivered = shipmentRepository.findByStatus("DELIVERED");
      int toRemove = (int) (total - 4000);
      int removed = 0;
      for (Shipment s : delivered) {
        if (removed >= toRemove) break;
        shipmentRepository.delete(s);
        removed++;
      }
      if (removed > 0) {
        log.info("🧹 Cleaned up {} old delivered shipments.", removed);
      }
    }
    */
  }

  private void updateCoordinates(Shipment s) {
    String routePath = s.getRoutePathJson();
    if (routePath == null || routePath.isEmpty()) return;

    // Parse JSON array format: ["SHA","SIN"] -> SHA,SIN
    String cleanPath = routePath.replace("[", "").replace("]", "").replace("\"", "");
    String[] path = cleanPath.split(",");
    if (path.length < 2) return;

    int totalLegs = path.length - 1;
    double globalProgress = s.getProgressPercent() / 100.0;

    int currentLegIndex = (int) (globalProgress * totalLegs);
    if (currentLegIndex >= totalLegs)
      currentLegIndex = totalLegs - 1;

    String startHubCode = path[currentLegIndex];
    String endHubCode = path[currentLegIndex + 1];

    Hub origin = hubRepository.findById(startHubCode).orElse(null);
    Hub destination = hubRepository.findById(endHubCode).orElse(null);

    if (origin != null && destination != null) {
      double legProgress = (globalProgress * totalLegs) - currentLegIndex;

      double currentLat = origin.getLatitude() + (destination.getLatitude() - origin.getLatitude()) * legProgress;
      double currentLng = origin.getLongtitude() + (destination.getLongtitude() - origin.getLongtitude()) * legProgress;

      s.setCurrentLat(currentLat);
      s.setCurrentLng(currentLng);
    }
  }
}

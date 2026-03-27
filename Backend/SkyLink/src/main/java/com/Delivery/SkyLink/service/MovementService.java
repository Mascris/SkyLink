package com.Delivery.SkyLink.service;

import com.Delivery.SkyLink.model.Hub;
import com.Delivery.SkyLink.model.Ship;
import com.Delivery.SkyLink.model.Shipment;
import com.Delivery.SkyLink.repository.HubRepository;
import com.Delivery.SkyLink.repository.ShipmentRepository;
import com.Delivery.SkyLink.repository.ShipRepository;

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
  private final ShipRepository shipRepository;
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

    // ─── Resume sheltering shipments if next hub weather is now CLEAR ───
    List<Shipment> sheltering = shipmentRepository.findByStatus("SHELTERING");
    for (Shipment s : sheltering) {
      Hub nextHub = resolveNextHub(s);
      if (nextHub != null) {
        String weather = nextHub.getWeatherCondition();
        if (weather == null || weather.equalsIgnoreCase("CLEAR")) {
          s.setStatus("TRANSIT");
          shipmentRepository.save(s);
          log.info("☀️ SHELTER LIFTED: [{}] resumes transit — weather CLEAR at {}",
              s.getLabel(), nextHub.getHubCode());
        } else {
          log.info("⛈️ STILL SHELTERING: [{}] waiting for storm to pass at {}",
              s.getLabel(), nextHub.getHubCode());
        }
      } else {
        // Can't determine next hub, let it continue
        s.setStatus("TRANSIT");
        shipmentRepository.save(s);
      }
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

      // ─── Weather / Chaos Logic ───
      Hub nextHub = resolveNextHub(s);
      if (nextHub != null) {
        String weather = nextHub.getWeatherCondition();
        if (weather != null && weather.equalsIgnoreCase("STORM")) {
          s.setStatus("SHELTERING");
          shipmentRepository.save(s);
          log.warn("⛈️ STORM AHEAD: [{}] is sheltering — STORM at hub {}",
              s.getLabel(), nextHub.getHubCode());
          continue;
        }
      }

      // ~10% chance of delay per tick
      if (random.nextDouble() < 0.10) {
        s.setStatus("DELAYED");
        shipmentRepository.save(s);
        log.info("⚠️ DELAYED: [{}] has been delayed!", s.getLabel());
        continue;
      }

      // Determine speed increment from the assigned ship
      int increment = resolveSpeedIncrement(s);
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

  /**
   * Determines the NEXT hub a shipment is heading towards based on its route and progress.
   * Returns null if it cannot be determined.
   */
  private Hub resolveNextHub(Shipment s) {
    String routePath = s.getRoutePathJson();
    if (routePath == null || routePath.isEmpty()) return null;

    String cleanPath = routePath.replace("[", "").replace("]", "").replace("\"", "");
    String[] path = cleanPath.split(",");
    if (path.length < 2) return null;

    int totalLegs = path.length - 1;
    double globalProgress = s.getProgressPercent() / 100.0;
    int currentLegIndex = (int) (globalProgress * totalLegs);
    if (currentLegIndex >= totalLegs) currentLegIndex = totalLegs - 1;

    // The "next" hub is the end of the current leg
    String nextHubCode = path[currentLegIndex + 1].trim();
    return hubRepository.findById(nextHubCode).orElse(null);
  }

  /**
   * Looks up the ship assigned to this shipment and returns its SpeedFactor as the
   * progress increment. Falls back to a random 5–10 if no ship is found.
   */
  private int resolveSpeedIncrement(Shipment s) {
    if (s.getShipId() != null) {
      return shipRepository.findById(s.getShipId())
          .map(Ship::getSpeedFactor)
          .orElse(5 + random.nextInt(6));
    }
    return 5 + random.nextInt(6);
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

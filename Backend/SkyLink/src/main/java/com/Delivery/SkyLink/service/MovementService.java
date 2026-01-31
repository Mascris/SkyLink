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

@Service
@Slf4j
@RequiredArgsConstructor
public class MovementService {

  private final ShipmentRepository shipmentRepository;
  private final HubRepository hubRepository;

  @Scheduled(fixedRate = 32000)
  public void moveShipments() {
    List<Shipment> queued = shipmentRepository.findByStatus("IN_QUEUE");

    for (Shipment s : queued) {
      s.setStatus("TRANSIT");
      shipmentRepository.save(s);
      log.info("⚓ SHIPMENT [{}] has left the port!", s.getLabel());
    }

    List<Shipment> inTransit = shipmentRepository.findByStatus("TRANSIT");
    for (Shipment s : inTransit) {
      int newProgress = s.getProgressPercent() + 5;

      if (newProgress >= 100) {
        s.setProgressPercent(100);
        s.setStatus("DELIVERED");
        log.info("🏁 ARRIVED: [{}] has reached its destination!", s.getLabel());
      } else {
        s.setProgressPercent(newProgress);
        updateCoordinates(s);
      }
      shipmentRepository.save(s);
    }
  }

  private void updateCoordinates(Shipment s) {
    String[] path = s.getRoutePathJson().split(",");

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

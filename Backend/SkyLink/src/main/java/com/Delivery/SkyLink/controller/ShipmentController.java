package com.Delivery.SkyLink.controller;

import com.Delivery.SkyLink.model.Shipment;
import com.Delivery.SkyLink.repository.ShipmentRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ShipmentController {

  private final ShipmentRepository shipmentRepository;

  @GetMapping("/active")
  public List<Shipment> getActiveShipments() {
    return shipmentRepository.findAll();
  }

  @PostMapping
  public Shipment createShipment(@RequestBody Shipment shipment) {
    return shipmentRepository.save(shipment);
  }
}
